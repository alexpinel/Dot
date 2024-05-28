"""A Class that reads a file and returns its contents in the required data structure"""

from . import pickle
from . import configparser
from . import json


class ReadFile:
    """A Class that reads a file and returns its contents in the required data structure"""

    def read_txt(self, filepath: str, as_list: bool = False, delimiter: str = "\n"):
        """## Read `.txt` Files to variables effortlessly.

        Args:
            filepath (str): Path to your `.txt` file
            as_list (bool, optional): Return file contents as a list. Defaults to False.
            delimiter (str, optional): Delimiter to split the file contents to return as a list. Defaults to "\\n".

        Returns:
            Any: `str` or `list`
        """
        read_mode_string = "r"
        with open(filepath, mode=read_mode_string, encoding="utf-8") as file_contents:
            contents = file_contents.read()

        if as_list:
            contents = contents.split(delimiter)

        return contents

    def read_pickle(self, filepath: str):
        """## Read `.pickle` or `.pkl` Files.

        Args:
            filepath (str): Path to your `.pickle` or `.pkl` file.

        Returns:
            Any
        """
        read_mode_string = "rb"
        with open(filepath, read_mode_string) as file_contents:
            contents = pickle.load(file_contents)

        return contents

    def read_config(self, filename: str) -> configparser.ConfigParser:
        """Reads .ini file and returns the object

        Returns:
            object: config object
        """
        config = configparser.ConfigParser()
        config.read(filename)
        return config

    def read_json(self, filename: str) -> dict:
        """Get JSON contents as a dictionary

        Args:
            filename (str): Name of the JSON file to read contents from.

        Returns:
            dict: Dictionary output of the JSON file.
        """
        with open(filename) as file_contents:
            json_dict = json.load(file_contents)

        return json_dict

    def read_jsonl(self, filepath: str) -> list:
        """Get JSONL contents as a list

        Args:
            filepath (str): Path of the JSONL file to read contents from.

        Returns:
            list: List output of the JSONL file.
        """
        with open(filepath, "r", encoding="utf-8") as jsonl_file:
            return [json.loads(line) for line in jsonl_file]
