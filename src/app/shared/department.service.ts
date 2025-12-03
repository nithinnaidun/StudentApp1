import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  private baseUrl = "https://localhost:7099/api/Student";

  constructor(private http: HttpClient) {}

  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/GetDepartments`);
  }
}