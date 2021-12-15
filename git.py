"""
Git interface
"""
import subprocess
import logging
import io
import os
from collections import Counter

class GIterator:
    """Iterator over lines from git output"""
    def __init__(self, args, cwd=None):
        self.args = ['/usr/bin/git']
        self.args += args
        self.cwd = cwd
        self.process = None
        self.line_iterator = None

    @classmethod
    def log(cls, args, since, cwd = None):
        """ Run git log"""
        cmd = ["log"]
        if since:
            cmd += [f"--after={cfg['since']}"]
        return cls(cmd + args, cwd)

    @classmethod
    def log(cls, cfg, args):
        """ Run git log"""
        cmd = ["log"]
        if "since" in cfg:
            cmd += [f"--after={cfg['since']}"]
        cmd += args
        if "dir" in cfg:
            cmd += [cfg["folder"]]
        return cls(cmd, cwd = cfg["dir"])

    @classmethod
    def show(cls, cfg, args):
        """ Run git show"""
        cmd = ["show"]
        if "since" in cfg:
            cmd += [f"--after={cfg['since']}"]
        cmd += args
        if "dir" in cfg:
            cmd += [cfg["folder"]]
        return cls(cmd, cwd = cfg["dir"])


    def __iter__(self):
        return self

    def __next__(self):
        if not self.process:
            self.start()
        return next(self.line_iterator).rstrip()

    def start(self):
        """Start the process and create the line iterator"""
        print(f'running "{" ".join(self.args)}" in {self.cwd}')
        self.process = subprocess.Popen(self.args, stdout=subprocess.PIPE, cwd = self.cwd)
        self.line_iterator = iter(io.TextIOWrapper(self.process.stdout, encoding="utf-8"))



def touches(cfg):
    """
    How often is something touched
    """

    counter = Counter()
    for line in GIterator.log(cfg, ["--format=%ae"]):
        counter.update({line:1})

    max_value = counter.most_common(1)[0][1] if len(counter) > 0 else 0
    res = {}
    res["counter"]=  [ {"author": field, "edits":count} for (field, count) in counter.most_common()]
    res["max"] = max_value

    return res


def edits(cfg):
    """
    whom touched this
    """
    counter = Counter()
    for line in GIterator.log(cfg, ["--format=", "--name-only"]):
        counter.update({line:1})

    max_value = counter.most_common(1)[0][1] if len(counter) > 0 else 0
    res = {}
    res["counter"]=  [ {"file" : field, "edits" : count} for (field, count) in counter.most_common(100)]
    res["max"] = max_value

    return res



def tranform_links_to_hierarhy(ls):
    res = {}
    for f in ls :
        head, tail = os.path.split(f)
        it = res;
        for k in head.split("/"):
            if k not in it:
                it[k] = {}
            it = it[k]
        it[tail] = {"name" : f, "links" : ls[f].most_common()}

    return d3_hirarchy(res);

def get_links(cfg):
    res = {}
    for rev in GIterator.log(cfg, ['--format=%H']):
        files =[ line for line in GIterator.show(cfg, ["--format=", "--name-only", rev])]
        for f in files:
            if not f in res:
                res[f] = Counter();
            res[f].update({ fn : 1 for fn in files if fn != f})
    return tranform_links_to_hierarhy(res);

def d3_hirarchy(ls):
    print(f"examing {ls}")

    assert type(ls) == dict

    def is_node(n):
        return "name" in n

    if is_node(ls):
        return [ls]

    res = []
    for child in ls:
        children = ls[child];
        if is_node(children):
            res.append(children)
        else :
            nn = {"name" : child, "children" : d3_hirarchy(children)}
            res.append(nn)
    return res;

if __name__ == "__main__":
    from pprint import pprint as pp


    # print(touches({"folder" : ".", "since" : None, "dir" : "."}))
    # print(edits({"folder" : ".", "since" : None, "dir" : "."}))
    cfg = {"folder" : ".",  "dir" : "/home/jacob/Projects/maat-scripts/www/"}
    ls = get_links(cfg);
    pp(ls);
