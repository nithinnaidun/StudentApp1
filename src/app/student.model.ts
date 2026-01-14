export interface Student {
  studentID: number;
  FullName: string;
  Email: string;
  Phoneno: string;
  Gender: string; 
  Department: string;  // 👈 required
  Address: string;
  AddressProf: string;
  DocumentPaths?: string[];
}
