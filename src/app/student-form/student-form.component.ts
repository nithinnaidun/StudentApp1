import { Component } from '@angular/core';
import { StudentService } from '../student.service';

@Component({
  selector: 'app-student-form',
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.css']
})
export class StudentFormComponent {

  model: any = {};
  proofList: string[] = [];
  selectedFile!: File;
  Department: any[] = [];

  isDuplicateEmail = false;
  isDuplicatePhone = false;
  isSubmitted = false;

  constructor(private studentService: StudentService) {}

 ngOnInit() {
  const data = localStorage.getItem("editStudent");

  if (data) {
    const editData = JSON.parse(data);

    // FIX: map backend Email → model.email
    this.model.StudentID = editData.StudentID;
    this.model.email = editData.Email;
    this.model.fullName = editData.FullName;
    this.model.phoneno = editData.Phoneno;
    this.model.gender = editData.Gender;
    this.model.department = editData.Department;
    this.model.address = editData.Address;

    this.model.originalEmail = editData.Email; // IMPORTANT

    this.proofList = editData.AddressProf
      ? editData.AddressProf.split(',')
      : [];
  }

  this.studentService.getDepartments().subscribe(res => {
    this.Department = res;
  });
}


  toggleProof(event: any) {
    const value = event.target.value;

    if (event.target.checked) {
      this.proofList.push(value);
    } else {
      this.proofList = this.proofList.filter(x => x !== value);
    }

    this.model.AddressProf = this.proofList.join(',');
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) this.selectedFile = file;
  }

  onSubmit(form: any) {
     this.isSubmitted = true;

    if (form.invalid || this.proofList.length === 0 || this.isDuplicateEmail) {
    return; 
    }

    if (this.model.StudentID) {
      this.updateStudent(form);
    } else {
      this.insertStudent(form);
    }
  }

 insertStudent(form: any) {
  this.studentService.insertStudent(this.model).subscribe({
    next: (res: any) => {
      alert(res.Message);
      if (this.selectedFile) {
        const formData = new FormData();
        formData.append("file", this.selectedFile);

        this.studentService.uploadDocument(formData).subscribe(() => {
          alert("Document uploaded successfully!");
        });
      }
      this.resetForm(form);
    },

    error: (err: any) => {
      alert(err.error.Message);
    }
  });
}


  updateStudent(form: any) {
    this.studentService.updateStudent(this.model.StudentID, this.model)
      .subscribe(() => {
        alert("Updated Successfully!");
        this.resetForm(form);
      });
  }

checkEmail() {
  if (!this.model.email) return;

  this.studentService.checkEmail(this.model.email)
    .subscribe((exists: boolean) => {
      if (this.model.StudentID && this.model.originalEmail === this.model.email) {
        this.isDuplicateEmail = false;
        return;
      }
      this.isDuplicateEmail = exists;
    });
}

  checkPhone() {
    if (!this.model.Phoneno) return;

    this.studentService.checkPhone(this.model.Phoneno)
      .subscribe(exists => {
        this.isDuplicatePhone = exists;
      });
  }

  resetForm(form: any) {
    form.reset();
    this.model = {};
    this.proofList = [];
    this.selectedFile = undefined!;
    this.isSubmitted = false;

    localStorage.removeItem("editStudent");
  }
}
