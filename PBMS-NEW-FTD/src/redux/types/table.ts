export interface ITable {
  id: number;
  number: number;
  status: 'OCCUPIED' | 'AVAILABLE' | 'RESERVED' | 'OUT_OF_SERVICE';
}