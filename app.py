"""
Use flask to serve git data mined from local repo and add d3.js for pretty graphics

"""
from collections import Counter
import os
import git
from flask import Flask, render_template, request, redirect, jsonify, send_from_directory


# Initiate Flask Application
app = Flask(__name__)

@app.route('/')
def index():
    """
    Just render index
    """
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/project')
def projects():
    """
    get the "projects" config
    """
    p = {}
    p["name"] = "inkscape"
    p["dir"] =  "/home/jacob/src/inkscape"
    p["since"] = "2020-10-13"
    p["folder"] = "."
    path = os.path.join(p["dir"], p["folder"])
    p["dirs"] = [f.name for f in os.scandir(path) if f.is_dir() and not f.name.startswith(".")]
    return jsonify(p)


@app.route('/drilldown/<directory>',methods=['POST'])
def drilldown(directory):
    """
    Who touched files in treespec
    """
    cfg = request.json
    cfg["folder"] = os.path.join(cfg["folder"],directory)
    path = os.path.join(cfg["dir"], cfg["folder"])
    cfg["dirs"] = [f.name for f in os.scandir(path) if f.is_dir() and not f.name.startswith(".")]
    return jsonify(cfg)

@app.route('/touches',methods=['POST'])
def touches():
    """
    Who touched files in treespec
    """
    return jsonify(git.touches(request.json))

@app.route('/edits', methods=['POST'])
def edits():
    return jsonify(git.edits(request.json))

@app.route('/correlate', methods=['POST'])
def correlate():
    res = git.get_links(request.json)
    res = {"name": "root", "children" : res}
    return jsonify(res)

if __name__ == '__main__':
    # Threaded option to enable multiple instances for multiple user access support
    app.run(debug=True, port=5000)

