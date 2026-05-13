from flask import Flask
from flask_cors import CORS

from routes.course_routes import course_bp
from routes.registration_routes import registration_bp
from routes.grades_routes import grades_bp
from dotenv import load_dotenv

load_dotenv()
from routes.ai_routes import ai_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(course_bp)
app.register_blueprint(registration_bp)
app.register_blueprint(grades_bp)
app.register_blueprint(ai_bp)

if __name__ == "__main__":
    app.run(debug=True)