"""
Functions to speed up data retrieval

Git history is frozen - we might as well freeze the queries
"""
import os
import json
import hashlib

dir_path = os.path.dirname(os.path.realpath(__file__))
cache_dir = os.path.join(dir_path, "cache")



def hash_fun(cfg):
    m = hashlib.sha256()
    for key in ["name", "dir", "since", "folder", "filename"]:
        if key in cfg:
            m.update(cfg[key].encode())
    return m.hexdigest()

class Memoize:
    """ Basic memoiser in memory

    store json data based on function and configuration.
    Two levels, memory and disk

    """

    misses = 0
    mem_hit = 0
    disk_hit = 0

    def __init__(self, fun):
        self.fun = fun
        self.mem = {}

    def load(self, key, cfg):
        file_name = f"{self.fun.__name__}-{str(key)}.json"
        file_path = os.path.join(cache_dir, file_name)
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)

        if not os.path.exists(file_path):
            data = self.fun(cfg)
            self.misses += 1
            with open(file_path, 'w') as f:
                json.dump(data, f)
        else:
            self.disk_hit += 1

        with open(file_path, 'r') as file_data:
            return json.load(file_data)


    def __call__(self, cfg):
        key = hash_fun(cfg)
        if key not in self.mem:
            self.mem[key] = self.load(key, cfg)
        else:
            self.mem_hit += 1
        print(self.stats())
        return self.mem[key]

    def stats(self):
        total = self.misses + self.disk_hit + self.mem_hit
        def p(v):
            return int(100 * v / total)
        return f'{self.fun.__name__}: Disk {p(self.disk_hit)}% Memory {p(self.mem_hit)}% Misses {p(self.misses)}%'
