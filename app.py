import mariadb
import hashlib  
from flask import Flask, render_template, redirect, url_for, session, jsonify, request
import requests
import logging
from functools import wraps
from datetime import timedelta
import os
from werkzeug.utils import secure_filename

app = Flask(__name__, static_url_path='/static')
app.secret_key = "supersecretkey"  
app.permanent_session_lifetime = timedelta(minutes=30) 
@app.before_request
def refresh_session():
    """ Rafraîchit la session si l'utilisateur est actif """
    session.modified = True  



UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS




db_config = {
    "host": "mysql2.ouiheberg.com",  
    "user": "u4873_4BAItSSr72",  
    "password": "HMj^XnRVNJB@tAcxOOqZBKE+",  
    "database": "s4873_SAE",  
    "port": 3306  
}


def get_db_connection():
    """Créer une connexion à la base de données."""
    return mariadb.connect(**db_config)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))  
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get("role") != 1:
            return redirect(url_for('my_page'))  # Redirige si pas admin
        return f(*args, **kwargs)
    return decorated_function


# ------------------- ROUTES -------------------

@app.route('/')
@login_required
def my_page():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('index.html', username=session['username'], role=session['role'])

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('pseudo')
        password = request.form.get('password')

        if not username or not password:
            return "Tous les champs sont obligatoires", 400

        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("SELECT id, role FROM users WHERE pseudo = %s AND password = %s", (username, hashed_password))
            user = cursor.fetchone()

            cursor.close()
            conn.close()

            if user:
                session.permanent = True
                session["user_id"] = user[0]
                session["username"] = username
                session["role"] = user[1]
                return redirect(url_for('my_page'))
            else:
                return "Pseudo ou mot de passe incorrect", 400

        except mariadb.Error as e:
            return f"Erreur : {e}", 500

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('pseudo')
        password = request.form.get('password')

        if not username or not password:
            return "Tous les champs sont obligatoires", 400

        username = username.strip()
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Vérifier si le pseudo existe déjà
            cursor.execute("SELECT COUNT(*) FROM users WHERE pseudo = %s", (username,))
            (count,) = cursor.fetchone()

            if count > 0:
                return "Ce nom d'utilisateur existe déjà", 400

            # Insérer avec role = 0 par défaut
            cursor.execute("INSERT INTO users (pseudo, password, role) VALUES (%s, %s, %s)", (username, hashed_password, 0))
            conn.commit()

            cursor.close()
            conn.close()
            return redirect(url_for('login'))
        except mariadb.Error as e:
            return f"Erreur : {e}", 500  # Affiche l'erreur exacte

    return render_template('register.html')


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/photo')
@login_required
def photo():
   return render_template('photo.html')

@app.route('/wiki')
@login_required
def wiki():
   return render_template('wiki.html')

@app.route('/communaute')
@login_required
def communaute():
   return render_template('communaute.html')



@app.route('/flore', methods=['GET'])
@login_required
def flore():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    logging.debug("Récupération des filtres disponibles")
    cursor.execute("SELECT DISTINCT type FROM plantes")
    types = [row['type'] for row in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT exposition FROM plantes")
    expositions = [row['exposition'] for row in cursor.fetchall()]
    
    cursor.execute("SELECT DISTINCT entretien FROM plantes")
    entretiens = [row['entretien'] for row in cursor.fetchall()]

    # Récupérer les filtres et la recherche
    search = request.args.get('search', '').strip()
    type_plante = request.args.get('type', '').strip()
    exposition = request.args.get('exposition', '').strip()
    entretien = request.args.get('entretien', '').strip()

    logging.debug(f"Filtres reçus - search: {search}, type: {type_plante}, exposition: {exposition}, entretien: {entretien}")

    # Construire la requête SQL avec les filtres dynamiques
    query = "SELECT * FROM plantes WHERE 1=1"
    params = []
    
    if search:
        query += " AND nom LIKE %s"
        params.append(f"%{search}%")
    if type_plante:
        query += " AND type = %s"
        params.append(type_plante)
    if exposition:
        query += " AND exposition = %s"
        params.append(exposition)
    if entretien:
        query += " AND entretien = %s"
        params.append(entretien)

    logging.debug(f"Requête SQL exécutée: {query} avec paramètres {params}")
    cursor.execute(query, params)
    plantes = cursor.fetchall()

    logging.debug(f"Nombre de plantes récupérées: {len(plantes)}")

    # Vérifier si c'est une requête AJAX
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(plantes)

    # Organiser les plantes par type
    plantes_par_type = {}
    for plante in plantes:
        if plante['type'] not in plantes_par_type:
            plantes_par_type[plante['type']] = []
        plantes_par_type[plante['type']].append(plante)

    conn.close()
    
    return render_template('flore.html', plantes_par_type=plantes_par_type, types=types, expositions=expositions, entretiens=entretiens)

@app.route('/plante/<int:plante_id>')
@login_required
def plante_details(plante_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Récupérer la plante
    cursor.execute("SELECT * FROM plantes WHERE id = %s", (plante_id,))
    plante = cursor.fetchone()

    # Récupérer les mois de plantation et de cueillette
    cursor.execute("SELECT mois_id, type FROM plantes_mois WHERE plante_id = %s", (plante_id,))
    mois_associes = cursor.fetchall()

    conn.close()

    # Organiser les mois en dictionnaires
    plantation = [m['mois_id'] for m in mois_associes if m['type'] == 'plantation']
    cueillette = [m['mois_id'] for m in mois_associes if m['type'] == 'cueillette']

    return render_template('plante_details.html', plante=plante, plantation=plantation, cueillette=cueillette)


PLANTNET_API_URL = "https://my-api.plantnet.org/v2/identify/all"
API_KEY = "2b109nKsQens03DMaJ6mld1Bu"  # Remplace par ta clé API Pl@ntNet

@app.route('/identify', methods=['POST'])
@login_required
def identify_plant():
    if 'photo' not in request.files:
        return jsonify({"error": "Aucune image reçue"}), 400

    file = request.files['photo']
    files = {"images": (file.filename, file.stream, file.mimetype)}
    params = {
        "api-key": API_KEY,
        "lang": "fr"  # Demander les résultats en français
    }

    response = requests.post(PLANTNET_API_URL, files=files, params=params)
    data = response.json()

    if not data.get("results"):
        return jsonify({"success": False})

    # 🔍 Vérifier les 3 meilleurs résultats
    for best_match in data["results"][:3]:
        nom_scientifique = best_match["species"]["scientificName"]
        nom_fr = best_match["species"]["commonNames"][0] if best_match["species"]["commonNames"] else "Nom inconnu"

        if nom_fr != "Nom inconnu":
            break  # On garde le premier résultat avec un nom en français

    # 🔍 Vérifier si la plante est en base de données
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id FROM plantes WHERE nom LIKE %s", (f"%{nom_fr}%",))
    plante = cursor.fetchone()
    conn.close()

    return jsonify({
        "success": True,
        "nom_fr": nom_fr,
        "nom_scientifique": nom_scientifique,
        "in_database": bool(plante),
        "plante_id": plante["id"] if plante else None
    })


# 🌍 Trouver un nom français parmi les traductions
def get_french_name(common_names):
    for name in common_names:
        if any(c in name for c in "éèêàçù"):  # Vérifie s'il y a des accents
            return name
    return common_names[0] if common_names else "Nom inconnu"


# ------------------- ADMIN -------------------

@app.route('/admin/add_plante', methods=['GET', 'POST'])
@admin_required
def add_plante():
    if request.method == 'POST':
        nom = request.form.get("nom")
        nom_scientifique = request.form.get("nom_scientifique")
        type_plante = request.form.get("type")
        exposition = request.form.get("exposition")
        entretien = request.form.get("entretien")
        description = request.form.get("description")
        description_expo = request.form.get("description_expo")
        description_arro = request.form.get("description_arro")
        image = request.files['image']

        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)  # Sécuriser le nom du fichier
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(image_path)  # Sauvegarder l'image

            image_url = f"uploads/{filename}"  # Chemin pour afficher l’image

            try:
                conn = get_db_connection()
                cursor = conn.cursor()

                cursor.execute(
                    "INSERT INTO plantes (nom, nom_scientifique, type, exposition, entretien, description, description_expo, description_arro, image_url) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (nom, nom_scientifique, type_plante, exposition, entretien, description, description_expo, description_arro, image_url)
                )
                conn.commit()

                cursor.close()
                conn.close()

                return redirect(url_for("flore"))

            except mariadb.Error as e:
                return f"Erreur lors de l'ajout : {e}", 500
        else:
            return "Format d'image non valide", 400

    return render_template("add_plantes.html")


if __name__ == '__main__':
    app.run(debug=True)
