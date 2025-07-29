export type Item = {
  id: string;
  name: string;
};

export type Column = {
  id: string;
  name: string;
  tasks: Item[];
};