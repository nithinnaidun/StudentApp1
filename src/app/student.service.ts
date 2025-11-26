import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  private baseUrl = "https://localhost:7099/api/Student";

  constructor(private http: HttpClient) {}

  // GET ALL STUDENTS
  getStudents(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  // INSERT
  insertStudent(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/InsertStudent`, data);
  }

  // UPDATE
  updateStudent(id: number, model: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/UpdateStudent/${id}`, model);
  }

  // DELETE
  deleteStudent(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/DeleteStudent/${id}`);
  }

  // FILE UPLOAD
  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/UploadDocument`, formData);
  }

  // GET DEPARTMENTS
  getDepartments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sp_GetDepartment`);
  }

  // CHECK DUPLICATE EMAIL
  checkEmail(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/check-email/${email}`);
  }

  // CHECK DUPLICATE PHONE
  checkPhone(phone: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/check-phone/${phone}`);
  }
}
