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

  constructor(private studentService: StudentService) {}

 ngOnInit() {
  const data = localStorage.getItem("editStudent");
  if (data) {
    this.model = JSON.parse(data);  
    this.proofList = this.model.addressProf
      ? this.model.addressProf.split(','): [];
    console.log("Edit Student:", this.model);
  }

  // Load departments
  this.studentService.getDepartments().subscribe((res: any[]) => {this.Department = res;});
}

  toggleProof(event: any) {
    const value = event.target.value;
    if (event.target.checked) this.proofList.push(value);
    else this.proofList = this.proofList.filter(x => x !== value);
    this.model.addressProf = this.proofList.join(',');
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) this.selectedFile = file;
  }

  onSubmit(form: any) {

  // Validation
  if (!this.model.fullName?.trim()) return alert("Full Name is required");
  if (!this.model.phoneno?.trim()) return alert("Phone Number is required");
  if (this.model.phoneno.length !== 10) return alert("Invalid Phone");
  if (!this.model.email?.trim()) return alert("Email required");
  if (!this.model.gender) return alert("Gender required");
  if (!this.model.department || this.model.department === "") {
    return alert("Department required");
  }
  if (!this.model.address?.trim()) return alert("Address required");
  if (this.proofList.length === 0) return alert("Select at least one proof");

  this.model.createdAt = new Date();
 if (this.model.studentID)
 {
    this.updateStudent(form);     
  } 
  else {
    this.insertStudent(form);    
  }
}

  insertStudent(form: any) {
    this.studentService.insertStudent(this.model).subscribe(() => {

      if (this.selectedFile) {
        const formData = new FormData();
        formData.append("file", this.selectedFile);
        
        this.studentService.uploadDocument(formData).subscribe(() => {
          alert("Student & Document added successfully!");
        });
      } else {
        alert("Student added successfully!");
      }
      this.resetForm(form);
       
    });
  }

 updateStudent(form: any) {
  console.log("Updating ID:", this.model.studentID);
  console.log("Edit Student:", this.model.studentID);


  this.studentService.updateStudent(this.model.studentID, this.model)
    .subscribe(() => {
      alert("Updated Successfully!");
      this.resetForm(form);
    });
}

  resetForm(form: any) {
    form.reset();
    this.model = {};
    this.proofList = [];
    this.selectedFile = undefined!;
    localStorage.removeItem("editStudent");
  }
}
