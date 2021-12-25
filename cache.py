"""
Functions to speed up data retrieval

Git history is frozen - we might as well freeze the queries
"""
import os
import json

dir_path = os.path.dirname(os.path.realpath(__file__))
cache_dir = os.path.join(dir_path, "cache")


def hash_fun(cfg):
    return hash(frozenset(cfg))

class Memoize:
    """ Basic memoiser in memory

    store json data based on function and configuration.
    Two levels, memory and disk

    """
    def __init__(self, fun):
        self.fun = fun
        self.mem = {}

    def load(self, cfg):
        key = hash_fun(cfg)
        file_name = f"{self.fun.__name__}-{str(key)}.json"
        file_path = os.path.join(cache_dir, file_name)
        if not os.path.exists(cache_dir):
            os.makedirs(cache_dir)

        if not os.path.exists(file_path):
            data = self.fun(cfg)
            with open(file_path, 'w') as f:
                json.dump(data, f)

        with open(file_path, 'r') as file_data:
            return json.load(file_data)


    def __call__(self, cfg):
        key = hash_fun(cfg)
        if key not in self.mem:
            self.mem[key] = self.load(cfg)
        return self.mem[key]
