from flask import Flask, send_from_directory
import os

app = Flask(__name__)

html_dir = ''

@app.route('/')
def home():
    return send_from_directory(html_dir, 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    if os.path.exists(os.path.join(html_dir, filename)):
        return send_from_directory(html_dir, filename)
    else:
        return "File not found", 404

if __name__ == '__main__':
    app.run(port=1133)
