import { Component, OnInit } from '@angular/core';
import { StudentService } from '../student.service';
import { Router } from '@angular/router';
import { Student } from '../student.model';
import { ChangeDetectorRef } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-student-form',
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.css']
})
export class StudentFormComponent implements OnInit {

  model: Student = {
    studentID: 0,
    FullName: '',
    Email: '',
    Phoneno: '',
    Gender: '',
    Department: '',
    Address: '',
    AddressProf: ''
  };

  awsAccessKey = '';
  awsSecretKey = '';

  departments: any[] = [];
  proofList: string[] = [];
  selectedFiles: File[] = [];

  constructor(
    private studentService: StudentService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {
    this.loadAWSKeys();
    this.loadDepartments();
    this.loadEditStudent();
  }

  // ===================== LOAD AWS KEYS =====================
  loadAWSKeys() {

    this.studentService.getAWSAccessKey().subscribe(res => {
      this.awsAccessKey = this.decrypt(res);
      console.log('Decrypted Access Key:', this.awsAccessKey);
    });

    this.studentService.getAWSSecretKey().subscribe(res => {
      this.awsSecretKey = this.decrypt(res);
      console.log('Decrypted Secret Key:', this.awsSecretKey);
    });

  }

  // ===================== LOAD DEPARTMENTS =====================
  loadDepartments() {
    this.studentService.getDepartments().subscribe({
      next: res => {
        this.departments = typeof res === 'string' ? JSON.parse(res) : res;
      },
      error: err => console.error('Department load failed', err)
    });
  }

  // ===================== LOAD EDIT DATA =====================
  loadEditStudent() {
    const data = localStorage.getItem('editStudent');
    if (!data) return;

    const s = JSON.parse(data);
    this.model = {
      studentID: s.StudentID || s.studentID || 0,
      FullName: s.FullName || '',
      Email: s.Email || '',
      Phoneno: s.Phoneno || '',
      Gender: s.Gender || '',
      Department: String(s.DepartmentId || s.Department || ''),
      Address: s.Address || '',
      AddressProf: s.AddressProf || ''
    };

    this.proofList = this.model.AddressProf
      ? this.model.AddressProf.split(',')
      : [];

    this.cdr.detectChanges();
  }

  // ===================== AES DECRYPT =====================
  decrypt(encryptedText: string): string {
    const key = CryptoJS.enc.Utf8.parse('NLKpQsoPaeoZ55ul');
    const iv  = CryptoJS.enc.Utf8.parse('RbeqxtNXxucHI123');

    return CryptoJS.AES.decrypt(encryptedText, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString(CryptoJS.enc.Utf8);
  }

  // ===================== FILE SELECT =====================
  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  // ===================== ADDRESS PROOF =====================
  toggleProof(event: any) {
    const value = event.target.value;

    if (event.target.checked) {
      this.proofList.push(value);
    } else {
      this.proofList = this.proofList.filter(x => x !== value);
    }

    this.model.AddressProf = this.proofList.join(',');
  }

  // ===================== SUBMIT =====================
  onSubmit(form: any) {
    if (!this.model.FullName.trim()) return alert('Full Name required');
    if (!this.model.Department) return alert('Select department');

    if (this.model.studentID > 0) {
      this.updateStudent(form);
    } else {
      this.insertStudent(form);
    }
  }

  // ===================== INSERT =====================
  insertStudent(form: any) {
    this.studentService.insertStudent(this.model).subscribe({
      next: async (res: any) => {
        const newId = res.studentId || res.StudentID;

        if (newId && this.selectedFiles.length > 0) {
          await this.uploadDocuments(newId);
        }

        alert('Inserted successfully');
        this.afterSave(form);
      },
      error: () => alert('Insert failed')
    });
  }

  // ===================== UPDATE =====================
  updateStudent(form: any) {
    this.studentService.updateStudent(this.model.studentID, this.model).subscribe({
      next: async () => {
        if (this.selectedFiles.length > 0) {
          await this.uploadDocuments(this.model.studentID);
        }

        alert('Updated successfully');
        this.afterSave(form);
      },
      error: () => alert('Update failed')
    });
  }

  // ===================== UPLOAD DOCUMENTS =====================
  uploadDocuments(studentId: number): Promise<any> {
    const formData = new FormData();
    this.selectedFiles.forEach(f => formData.append('files', f));

    return this.studentService.uploadToS3(studentId, formData).toPromise();
  }

  // ===================== AFTER SAVE =====================
  afterSave(form: any) {
    localStorage.removeItem('editStudent');
    this.resetForm(form);
    this.router.navigate(['/student-list']);
  }

  // ===================== RESET =====================
  resetForm(form: any) {
    this.model = {
      studentID: 0,
      FullName: '',
      Email: '',
      Phoneno: '',
      Gender: '',
      Department: '',
      Address: '',
      AddressProf: ''
    };

    this.selectedFiles = [];
    this.proofList = [];
    form?.resetForm();
  }
}
