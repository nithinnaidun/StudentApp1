import { Component, OnInit } from '@angular/core';
import { StudentService } from '../student.service';

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent implements OnInit {

  students: any[] = [];
  departments: any[] = [];
  selectedFiles: File[] = [];
  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadDepartments();
  }
  onFileSelected(event: any) {
  this.selectedFiles = Array.from(event.target.files);
}

  loadStudents() {
    this.studentService.getStudents().subscribe(res => this.students = res);
  }

  loadDepartments() {
    this.studentService.getDepartments().subscribe(res => this.departments = res);
  }

  getDeptName(id: number): string {
    const d = this.departments.find(x => x.DeptID == id);
    return d ? d.DeptName : "";
  }

  editStudent(s: any) {
    localStorage.setItem("editStudent", JSON.stringify(s));
    window.location.href = "/";
  }

  deleteStudent(id: number) {
    if (confirm("Are you sure?")) {
      this.studentService.deleteStudent(id).subscribe(() => {
        alert("Deleted Successfully");
        this.loadStudents();
      });
    }
  }
}
