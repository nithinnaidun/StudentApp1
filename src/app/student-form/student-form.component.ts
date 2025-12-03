import { Component, OnInit } from '@angular/core';
import { StudentService } from '../student.service';
import { Student } from '../student.model';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-student-form',
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.css']
})
export class StudentFormComponent implements OnInit {

  model: Student = {
    studentID: 0,
    FullName: "",
    Email: "",
    Phoneno: "",
    Gender: "",
    Department: "0",
    Address: "",
    AddressProf: ""
  };

  proofList: string[] = [];
  selectedFile!: File;
  DepartmentList: any[] = [];

  emailExists = false;
  phoneExists = false;

  awsAccessKey: any;
  awsSecretKey: any;
  awsBucketName = "btsworkerfiles";

  constructor(private studentService: StudentService) {}

  ngOnInit() {

    // Load ACCESS Key
    this.studentService.getAWSAccessKey().subscribe(res => {
      console.log("Encrypted Access Key:", res);
      this.awsAccessKey = this.decrypt(res);
      console.log("Decrypted Access Key:", this.awsAccessKey);
    });

    // Load SECRET Key
    this.studentService.getAWSSecretKey().subscribe(res => {
      console.log("Encrypted Secret Key:", res);
      this.awsSecretKey = this.decrypt(res);
      console.log("Decrypted Secret Key:", this.awsSecretKey);
    });

    // Load edit student
    const data = localStorage.getItem("editStudent");

    if (data) {
      const s = JSON.parse(data);

      this.model = {
        studentID: s.studentID,
        FullName: s.FullName ?? s.fullName,
        Email: s.Email ?? s.email,
        Phoneno: s.Phoneno ?? s.phoneno,
        Gender: s.Gender ?? s.gender,
        Department: String(s.Department ?? s.department),
        Address: s.Address ?? s.address,
        AddressProf: s.AddressProf ?? s.addressProf,
        CreatedAt: s.CreatedAt ?? new Date()
      };

      this.proofList = this.model.AddressProf ? this.model.AddressProf.split(",") : [];
    }

    // Load department list
    this.studentService.getDepartments().subscribe(res => {
      this.DepartmentList = res;
    });
  }

  // Toggle checkboxes
  toggleProof(event: any) {
    const value = event.target.value;
    if (event.target.checked) this.proofList.push(value);
    else this.proofList = this.proofList.filter(x => x !== value);

    this.model.AddressProf = this.proofList.join(',');
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  decrypt(encryptedText: string): string {
    const key = CryptoJS.enc.Utf8.parse('NLKpQsoPaeoZ55ul');
    const iv = CryptoJS.enc.Utf8.parse('RbeqxtNXxucHI123');

    const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  // Upload to S3
  uploadToS3(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) return reject("No file selected!");

      const fd = new FormData();
      fd.append("file", this.selectedFile);

      this.studentService.uploadToS3(
        fd,
        this.awsAccessKey,
        this.awsSecretKey,
        this.awsBucketName
      ).subscribe({
        next: (res: any) => {
          console.log("S3 Upload Success:", res);
          resolve(res.filePath);
        },
        error: (err) => {
          console.error("S3 Upload Error:", err);
          console.log("Validation Errors:", err.error.errors);
          console.log("About to upload to S3 with headers:", {
          awsAccess: this.awsAccessKey,
          awsSecret: this.awsSecretKey,
          awsBucket: this.awsBucketName
});
console.log("Selected file:", this.selectedFile?.name, "size:", this.selectedFile?.size);
          reject(err);
        }
      });
    });
  }

  // Submit
  onSubmit(form: any) {

    if (!this.model.FullName?.trim()) return alert("Full Name required");
    if (!this.model.Email?.trim()) return alert("Email required");
    if (!this.model.Phoneno?.trim()) return alert("Phone required");
    if (this.proofList.length === 0) return alert("Select at least one proof");

    this.model.CreatedAt = new Date();

    if (this.model.studentID)
      this.updateStudent(form);
    else
      this.insertStudent(form);
  }

  // Insert
  async insertStudent(form: any) {
    try {
      if (this.selectedFile)
        this.model.DocumentPath = await this.uploadToS3();

      this.studentService.insertStudent(this.model).subscribe({
        next: () => {
          alert("Inserted Successfully!");
          this.resetForm(form);
        },
        error: (err) => console.error(err)
      });

    } catch (err) {
      alert("File upload failed!");
    }
  }

  // Update
  async updateStudent(form: any) {

    try {
      if (this.selectedFile)
        this.model.DocumentPath = await this.uploadToS3();

      this.studentService.updateStudent(this.model.studentID, this.model)
        .subscribe({
          next: () => {
            alert("Updated Successfully!");
            this.resetForm(form);
            localStorage.removeItem("editStudent");
          }
        });

    } catch (err) {
      console.error(err);
      alert("Updated but file upload failed.");
    }
  }

  editStudent(s: any) {
    localStorage.setItem("editStudent", JSON.stringify(s));
    window.location.href = "/";
  }

  resetForm(form: any) {
    form.reset();
    this.proofList = [];
    this.selectedFile = undefined!;
    localStorage.removeItem("editStudent");
  }
}
