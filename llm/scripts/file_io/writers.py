"""Write File"""

from . import pickle
from . import json


class WriteFile:
    """Write File Class"""

    def __init__(self):
        """Initialize Write File Class"""
        self.write_mode_string = "w"
        self.write_binary_mode_string = "wb"

    def write_txt(
        self,
        filepath: str,
        contents,
        from_list: bool = True,
        delimiter: str = "\n",
    ):
        """write to `.txt` file

        Args:
            filepath (str)
            contents (_type_)
            from_list (bool, optional). Defaults to True.
            delimiter (str, optional). Defaults to "\n".

        Returns:
            None
        """
        if from_list:
            contents = delimiter.join(contents)
        with open(filepath, mode=self.write_mode_string, encoding="utf-8") as txt_file:
            txt_file.write(contents)

    def write_pickle(self, contents, filepath: str):
        """Write as pickle

        Args:
            contents (Any)
            filepath (str)
        """
        with open(
            filepath,
            self.write_binary_mode_string,
        ) as pickle_file:
            pickle.dump(contents, pickle_file)

    def write_json(self, dictionary: dict, filepath: str = "results.json"):
        """Write as JSON

        Args:
            dictionary (dict)
            filepath (str, optional). Defaults to "results.json".
        """
        with open(filepath, self.write_mode_string) as json_file:
            json.dump(dictionary, json_file)
