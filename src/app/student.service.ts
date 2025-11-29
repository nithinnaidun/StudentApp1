import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student } from './student.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  private baseUrl = "https://localhost:7099/api/Student";

  constructor(private http: HttpClient) {}

  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.baseUrl);
  }

  insertStudent(data: Student) {
    return this.http.post(`${this.baseUrl}/InsertStudent`, data);
  }

 updateStudent(id: number, model: any) {
  return this.http.put(`${this.baseUrl}/updateStudent/${id}`, model, { responseType: "text" });
}

  deleteStudent(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/DeleteStudent/${id}`);
  }
uploadDocument(fd: FormData) {
  return this.http.post(this.baseUrl + "/UploadDocument", fd);
}


updateDocumentPath(id: number, path: string) {
  return this.http.put(
    this.baseUrl + "/UpdateDocumentPath/" + id,JSON.stringify(path), 
    { headers: { "Content-Type": "application/json" } }
  );
}
  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sp_GetDepartment`);
  }
 
}
