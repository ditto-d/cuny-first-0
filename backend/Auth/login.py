import sys
from pathlib import Path

from flask import Flask
from flask_cors import CORS

backend_dir = Path(__file__).resolve().parents[1]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from routes.auth_routes import auth_bp

app = Flask(__name__)
CORS(app)
app.register_blueprint(auth_bp)


if __name__ == "__main__":
    app.run(debug=True, port=8000)
