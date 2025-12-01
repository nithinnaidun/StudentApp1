import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student } from './student.model';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  // AES key & IV (must be 16 characters)
  private aesKey  = CryptoJS.enc.Utf8.parse("1234567890123456");
  private aesIV   = CryptoJS.enc.Utf8.parse("1234567890123456");

  private baseUrl = "https://localhost:7099/api/Student";

  constructor(private http: HttpClient) { }

  // ---------------- AES ENCRYPT ----------------
  encryptAES(plainText: string): string {
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Utf8.parse(plainText),
      this.aesKey,
      {
        iv: this.aesIV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    return encrypted.toString();
  }

  // ---------------- AES DECRYPT ----------------
  decryptAES(cipherText: string): string {
    const decrypted = CryptoJS.AES.decrypt(
      cipherText,
      this.aesKey,
      {
        iv: this.aesIV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // ---------------- TEST AES ----------------
  testAES() {
    const original = "MyAWSAccessKey123";

    const encrypted = this.encryptAES(original);
    console.log("Encrypted:", encrypted);

    const decrypted = this.decryptAES(encrypted);
    console.log("Decrypted:", decrypted);

    return decrypted;
  }

  // ---------------- CRUD ----------------
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

  // ---------------- LOCAL UPLOAD ----------------
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

  // ---------------- GET DEPARTMENTS ----------------
  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/sp_GetDepartment`);
  }


  getAwsKeys() {
    return this.http.get("https://localhost:7099/api/Student/GetAwsKeys");
  }

  uploadToS3(fd: FormData, access: string, secret: string, bucket: string) {
    return this.http.post("https://localhost:7099/api/Student/UploadToS3", fd, {
      headers: {
        "aws-access": access,
        "aws-secret": secret,
        "aws-bucket": bucket
      }
    });
  }

}
