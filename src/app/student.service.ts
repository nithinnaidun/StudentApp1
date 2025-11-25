import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  private baseUrl = "https://localhost:7099/api/Student";

  constructor(private http: HttpClient) {}

  getStudents(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  insertStudent(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/InsertStudent`, data);
    
  }

updateStudent(id: number, model: any) {
  return this.http.put(`${this.baseUrl}/updateStudent/${id}`, model, {
    responseType: 'text'
  });
}

  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/UploadDocument`, formData);
  }
  getDepartments() {
  return this.http.get<any>(`${this.baseUrl}/sp_GetDepartment`);
}
deleteStudent(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/DeleteStudent/${id}`);
}
}
