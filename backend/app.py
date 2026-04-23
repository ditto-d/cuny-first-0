from flask import Flask
from routes.course_routes import course_bp
from routes.registration_routes import registration_bp

app = Flask(__name__)

app.register_blueprint(course_bp)
app.register_blueprint(registration_bp)

if __name__ == "__main__":
    app.run(debug=True)