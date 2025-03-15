from flask import Flask

app = Flask(__name__)

#Members API Route
@app.route('/members')
def members():
    return {"members": ["Diddy Debuts", "Uncle Ruckus", "Riley Freeman", "Huey Freeman"]}

if __name__ == '__main__':
    app.run(debug=True)
