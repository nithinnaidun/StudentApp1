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
  selectedFiles!: FileList;
  DepartmentList: any[] = [];
  emailExists: boolean = false;
  phoneExists: boolean = false;

  constructor(private studentService: StudentService) {}

  ngOnInit() {
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

      this.proofList = this.model.AddressProf
        ? this.model.AddressProf.split(',')
        : [];
    }

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
    this.selectedFiles = event.target.files;
  }

  onSubmit(form: any) {
    if (!this.model.FullName.trim()) return alert("Full Name is required");
    if (!this.model.Phoneno.trim()) return alert("Phone Number is required");
    if (this.model.Phoneno.length !== 10) return alert("Invalid Phone Number");
    if (!this.model.Email.trim()) return alert("Email is required");
    if (!this.model.Gender) return alert("Gender is required");
    if (!this.model.Department) return alert("Department is required");
    if (!this.model.Address.trim()) return alert("Address is required");
    if (this.proofList.length === 0) return alert("Select at least one Address Proof");

    this.model.CreatedAt = new Date();

    if (this.model.studentID) {
      this.updateStudent(form);
    } else {
      this.insertStudent(form);
    }
  }
insertStudent(form: any) {

  this.studentService.insertStudent(this.model).subscribe({
    next: (res: any) => {

      const newId = res.newStudentID;

      if (!this.selectedFiles || this.selectedFiles.length === 0) {
        alert("Student added successfully!");
        this.resetForm(form);
        return;
      }

   let fd = new FormData();

for (let i = 0; i < this.selectedFiles.length; i++) {
  fd.append("files", this.selectedFiles[i]);
}

this.studentService.uploadDocument(fd).subscribe((fileRes: any) => {

  const filePaths = fileRes.filePaths; 
  const allPaths = filePaths.join(',');
  this.studentService.updateDocumentPath(newId, filePaths.join(','))
    .subscribe(() => {
      alert("Student & all documents saved!");
      this.resetForm(form);
    });
    });
    },
    error: () => alert("Insert failed!")
  });
}

 updateStudent(form: any) {

  this.model.AddressProf = this.proofList.join(',');
  this.model.CreatedAt = new Date();
  this.studentService.updateStudent(this.model.studentID, this.model)
    .subscribe({
      next: () => {
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
          alert("Updated Successfully!");
          this.resetForm(form);
          return;
        }

        let uploadedPaths: string[] = [];
        const uploadNext = (i: number) => {
          if (i >= this.selectedFiles.length) {
            this.studentService.updateDocumentPath(
              this.model.studentID,
              uploadedPaths.join(',')
            ).subscribe(() => {
              alert("Updated Successfully including documents!");
              this.resetForm(form);
            });
            return;
          }

          const fd = new FormData();
          fd.append("files", this.selectedFiles[i]);

          this.studentService.uploadDocument(fd)
            .subscribe((fileRes: any) => {
              uploadedPaths.push(fileRes.filePaths[0]);
              uploadNext(i + 1);
            });
        };
        uploadNext(0);
      },

      error: () => alert("Update failed!")
    });
}

  editStudent(s: any) {
    localStorage.setItem("editStudent", JSON.stringify(s));
    window.location.href = "/";
  }

  resetForm(form: any) {
    form.reset();
    this.proofList = [];
    localStorage.removeItem("editStudent");
  }
}
