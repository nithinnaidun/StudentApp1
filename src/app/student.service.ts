import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { Student } from './student.model';
import* as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private _refreshNeededs$ = new Subject<void>();

  get_refreshNeededs() {
    return this._refreshNeededs$.asObservable();
  }

  private baseUrl = 'https://localhost:7099/api/Demo';

  constructor(private http: HttpClient) {}

  getAllStudents() {
    return this.http.get<any[]>(`${this.baseUrl}/GetAllStudents`);
  }

  getDepartments() {
    return this.http.get<any[]>(`${this.baseUrl}/sp_GetDepartment`);
  }

  insertStudent(student: Student) {
    return this.http.post<{ StudentId: number }>(`${this.baseUrl}/InsertStudent`, student).pipe(
        tap(() => this._refreshNeededs$.next()));
  }

  updateStudent(id: number, data: Student) {
    return this.http.put(`${this.baseUrl}/UpdateStudent/${id}`, data, {
      headers: { 'Content-Type': 'application/json' }}).pipe(
      tap(() => this._refreshNeededs$.next()));
  }

  deleteStudent(id: number) {
    return this.http.delete(`${this.baseUrl}/DeleteStudent/${id}`).pipe(
        tap(() => this._refreshNeededs$.next()));
  }

  uploadToS3(studentId: number, fd: FormData) {
    return this.http.post<{ Files: string[] }>(`${this.baseUrl}/UploadToS3/${studentId}`, fd);
  }

  // getDocumentFromS3(key: string) {
  //   return this.http.get<{ downloadUrl: string }>(
  //     `${this.baseUrl}/GetS3DocumentFile?key=${encodeURIComponent(key)}`
  //   );
  // }
  getS3DocumentFile(fileValue: string) {
  return this.http.get<{ downloadUrl: string }>(
    `https://localhost:7099/api/Demo/GetS3DocumentFile`,
    {
      params: { fileValue }
    }
  );
}


  getAWSAccessKey(): Observable<string> {
  return this.http.get(
    'https://external.balajitransports.in/api/DBConnectionString/GetAmazons3CredentialsS3AccessKey',
    { responseType: 'text' }
  );
}

getAWSSecretKey(): Observable<string> {
  return this.http.get(
    'https://external.balajitransports.in/api/DBConnectionString/GetAmazons3CredentialsS3SecretKey',
    { responseType: 'text' }
  );
}

}
