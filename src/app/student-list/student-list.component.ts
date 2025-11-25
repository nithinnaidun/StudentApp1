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

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadDepartments();
  }

  loadStudents() {
    this.studentService.getStudents().subscribe(res => {
      this.students = res;
    });
  }

  loadDepartments() {
    this.studentService.getDepartments().subscribe((res: any[]) => {
      this.departments = res;
    });
  }

  getDeptName(id: number): string {
    const dept = this.departments.find(d => d.DeptID == id);
    return dept ? dept.DeptName : "";
  }

  // EDIT Redirect to form
 editStudent(s: any) {
  localStorage.setItem("editStudent", JSON.stringify(s));
  window.location.href = "/";  
}

  // Permanently delete row
  deleteStudent(id: number) {
    if (confirm("Are you sure you want to delete this student?")) {
      this.studentService.deleteStudent(id).subscribe(() => {
        alert("Deleted Successfully!");
        this.loadStudents(); 
      });
    }
  }
}
