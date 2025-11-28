import { Component, OnInit } from '@angular/core';
import { StudentService } from '../student.service';
import { Student } from '../student.model';

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
emailExists: boolean = false;
phoneExists: boolean = false;


  constructor(private studentService: StudentService) {}

  ngOnInit() {

  const data = localStorage.getItem("editStudent");

  if (data) {
    const s = JSON.parse(data);

    console.log("Loading Edit Data:", s);  // ✔ Correct!

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

    // Load checkboxes
    this.proofList = this.model.AddressProf
      ? this.model.AddressProf.split(',')
      : [];
  }

  // Load department list
  this.studentService.getDepartments().subscribe(res => {
    this.DepartmentList = res;
  });
}


toggleProof(event: any) {
  const value = event.target.value;

  if (event.target.checked) this.proofList.push(value);
  else this.proofList = this.proofList.filter(x => x !== value);

  this.model.AddressProf = this.proofList.join(',');
}
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit(form: any) {

  // Validation
  if (!this.model.FullName?.trim()) return alert("Full Name is required");
  if (!this.model.Phoneno?.trim()) return alert("Phone Number is required");
  if (this.model.Phoneno.length !== 10) return alert("Invalid Phone Number");
  if (!this.model.Email?.trim()) return alert("Email is required");
  if (!this.model.Gender) return alert("Gender is required");
  if (!this.model.Department || this.model.Department === "") {
    return alert("Department is required");
  }
  if (!this.model.Address?.trim()) return alert("Address is required");
  if (this.proofList.length === 0) return alert("Select at least one Address Proof");

  this.model.CreatedAt = new Date();

  // Update or Insert
  if (this.model.studentID) {
    this.updateStudent(form);
  } else {
    this.insertStudent(form);
  }
}
insertStudent(form: any) {

  this.emailExists = false;
  this.phoneExists = false;

  this.studentService.insertStudent(this.model).subscribe({

    next: (res: any) => {

      const newId = res.newStudentID; // << IMPORTANT

      // If no file selected → finish
      if (!this.selectedFile) {
        alert("Student added successfully!");
        this.resetForm(form);
        return;
      }

      // 1️⃣ Upload File
      const fd = new FormData();
      fd.append("file", this.selectedFile);

      this.studentService.uploadDocument(fd).subscribe((fileRes: any) => {

        const filePath = fileRes.filePath; // "/Uploads/xxxx.pdf"

        // 2️⃣ Update DocumentPath in DB
        this.studentService.updateDocumentPath(newId, filePath)
          .subscribe(() => {

            alert("Student & Document added successfully!");
            this.resetForm(form);
          });

      });
    },

    error: (err) => {
      console.log("Insert Error:", err);

      if (err.error?.message === "Email already exists") {
        this.emailExists = true;
        return;
      }

      if (err.error?.message === "Phone number already exists") {
        this.phoneExists = true;
        return;
      }

      alert("Insert failed! Check console.");
    }
  });
}

updateStudent(form: any) {
  this.model.AddressProf = this.proofList.join(',');
  this.model.CreatedAt = new Date();

  console.log("UPDATE STARTED -> ID:", this.model.studentID);

  this.studentService.updateStudent(this.model.studentID, this.model)
    .subscribe({
      next: (res: any) => {
        console.log("UPDATE SUCCESS", res);
        if (!this.selectedFile) {
          alert("Updated Successfully!");
          this.resetForm(form);
          localStorage.removeItem("editStudent");
          return;
        }
        const fd = new FormData();
        fd.append("file", this.selectedFile);

        this.studentService.uploadDocument(fd).subscribe({
          next: (fileRes: any) => {
            const filePath = fileRes.filePath;
            this.studentService.updateDocumentPath(this.model.studentID, filePath)
              .subscribe({
                next: () => {
                  alert("Updated Successfully (including document)!");
                  this.resetForm(form);
                  localStorage.removeItem("editStudent");
                }
              });
          },
          error: (err) => {
            console.error("Document upload failed:", err);
            alert("Student updated, but document upload failed!");
          }
        });
      },

      error: (err) => {
        console.error("UPDATE ERROR", err);

        
        if (err.error?.message === "Email already exists") {
          alert("Email already exists!");
          return;
        }

        if (err.error?.message === "Phone number already exists") {
          alert("Phone number already exists!");
          return;
        }

        alert("Update failed! Check console.");
      }
    });
}
editStudent(s: any) {
  console.log("Selected Student For Edit:", s);

  localStorage.setItem("editStudent", JSON.stringify(s));

  // Navigate to form
  window.location.href = "/";
}

  resetForm(form: any) {
    form.reset();
    this.proofList = [];
    this.selectedFile = undefined!;
    localStorage.removeItem("editStudent");
  }
}
