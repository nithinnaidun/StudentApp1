import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student } from './student.model';
import * as CryptoJS from 'crypto-js';


@Injectable({
  providedIn: 'root'
})
export class StudentService {
 
  private baseUrl = "https://localhost:7099/api/Student";

  constructor(private http: HttpClient) { }

  getStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.baseUrl);
  }

  insertStudent(data: Student) {
    return this.http.post(`${this.baseUrl}/InsertStudent`, data);
  }

  updateStudent(id: number, model: any) {
    return this.http.put(`${this.baseUrl}/updateStudent/${id}`, model, {
      responseType: "text"
    });
  }

  deleteStudent(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/DeleteStudent/${id}`);
  }

  uploadDocument(fd: FormData) {
    return this.http.post(this.baseUrl + "/UploadDocument", fd);
  }

  updateDocumentPath(id: number, path: string) {
    return this.http.put(
      this.baseUrl + "/UpdateDocumentPath/" + id,
      JSON.stringify(path),
      { headers: { "Content-Type": "application/json" } }
    );
  }
  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sp_GetDepartment`);
  }

  getAwsKeys() {
    return this.http.get("https://localhost:7099/api/Student/GetAwsKeys");
  }

uploadToS3(fileData: FormData, access: string, secret: string, bucket: string) {

  console.log("uploadToS3 called with:", { access, secret, bucket, fileData });

  const headers = new HttpHeaders()
    .set("awsAccess", access)
    .set("awsSecret", secret)
    .set("awsBucket", bucket);

  return this.http.post(
    "https://localhost:7099/api/Student/UploadToS3",
    fileData,
    { headers }
  );
}




getAWSSecretKey(): Observable<string> {
  return this.http.get(
    "https://external.balajitransports.in/api/DBConnectionString/GetAmazons3CredentialsS3SecretKey",
    { responseType: 'text' }
  );
}

getAWSAccessKey(): Observable<string> {
  return this.http.get(
    "https://external.balajitransports.in/api/DBConnectionString/GetAmazons3CredentialsS3AccessKey",
    { responseType: 'text' }
  );
}


}
