from flask import Flask
from routes.course_routes import course_bp
from routes.registration_routes import registration_bp
from routes.grades_routes import grades_bp
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

app.register_blueprint(course_bp)
app.register_blueprint(registration_bp)
app.register_blueprint(grades_bp)

if __name__ == "__main__":
    app.run(debug=True)