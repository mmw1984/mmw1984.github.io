from flask import Flask, send_file
import os

app = Flask(__name__)

@app.route('/')
def serve_portfolio():
    return send_file('index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_file(filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
