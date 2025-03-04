import mariadb
import hashlib  # Pour hasher les mots de passe
from flask import Flask, render_template, request, redirect, url_for, session

app = Flask(__name__)
app.secret_key = "supersecretkey"  # Clé secrète pour gérer les sessions



db_config = {
    "host": "mysql2.ouiheberg.com",  # Adresse IP du serveur
    "user": "u4873_4BAItSSr72",  # Ton utilisateur MariaDB
    "password": "HMj^XnRVNJB@tAcxOOqZBKE+",  # Ton mot de passe
    "database": "s4873_SAE",  # Nom de la base de données
    "port": 3306  # Port (par défaut 3306)
}


def get_db_connection():
    """Créer une connexion à la base de données."""
    return mariadb.connect(**db_config)

# ------------------- ROUTES -------------------

@app.route('/')
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

            # Vérifier si l'utilisateur existe avec le bon mot de passe
            cursor.execute("SELECT id, role FROM users WHERE pseudo = %s AND password = %s", (username, hashed_password))
            user = cursor.fetchone()

            cursor.close()
            conn.close()

            if user:
                # Stocker l'utilisateur en session
                session["user_id"] = user[0]
                session["username"] = username
                session["role"] = user[1]  # Récupère le rôle (0 = utilisateur, 1 = admin)
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
    session.pop('user', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
