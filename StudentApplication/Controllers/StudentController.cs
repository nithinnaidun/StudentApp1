using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using StudentApplication.Controllers.Models;
using System.Data;
using System.Data.SqlClient;

namespace StudentApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StudentController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string connectionString;

        public StudentController(IConfiguration configuration)
        {
            _configuration = configuration;
            connectionString = configuration.GetConnectionString("StudentCon");
        }

        [HttpGet]
        public IActionResult GetAllStudents()
        {
            List<Student> students = new List<Student>();

            using (SqlConnection con = new SqlConnection(connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_GetStudentDetails", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                con.Open();

                SqlDataReader rd = cmd.ExecuteReader();
                while (rd.Read())
                {
                    students.Add(new Student
                    {
                        studentID = Convert.ToInt32(rd["StudentID"]),
                        FullName = rd["FullName"].ToString(),
                        Email = rd["Email"].ToString(),
                        Phoneno = rd["Phoneno"].ToString(),
                        Gender = rd["Gender"].ToString(),
                        Department = rd["Department"].ToString(),
                        Address = rd["Address"].ToString(),
                        AddressProf = rd["AddressProf"].ToString(),
                        CreatedAt = Convert.ToDateTime(rd["CreatedAt"])
                    });
                }
            }

            return Ok(students);
        }

        [HttpPost("InsertStudent")]
        public IActionResult InsertStudent([FromBody] Student input)
        {
            int newId = 0;

            using (SqlConnection con = new SqlConnection(connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_InsertStudent", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.AddWithValue("@FullName", input.FullName);
                cmd.Parameters.AddWithValue("@Email", input.Email);
                cmd.Parameters.AddWithValue("@Phoneno", input.Phoneno);
                cmd.Parameters.AddWithValue("@Gender", input.Gender);
                cmd.Parameters.AddWithValue("@Department", input.Department);
                cmd.Parameters.AddWithValue("@Address", input.Address);
                cmd.Parameters.AddWithValue("@AddressProf", input.AddressProf);

                con.Open();
                newId = Convert.ToInt32(cmd.ExecuteScalar());
            }

            return Ok(new { Message = "Student Inserted Successfully", NewStudentID = newId });
        }

        [HttpPut("updateStudent/{id}")]
        public IActionResult UpdateStudent(int id, [FromBody] Student model)
        {
            using (SqlConnection con = new SqlConnection(connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_UpdateStudent", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.AddWithValue("@StudentID", id);
                cmd.Parameters.AddWithValue("@FullName", model.FullName);
                cmd.Parameters.AddWithValue("@Email", model.Email);
                cmd.Parameters.AddWithValue("@Phoneno", model.Phoneno);
                cmd.Parameters.AddWithValue("@Gender", model.Gender);
                cmd.Parameters.AddWithValue("@Department", model.Department);
                cmd.Parameters.AddWithValue("@Address", model.Address);
                cmd.Parameters.AddWithValue("@AddressProf", model.AddressProf);

                con.Open();
                cmd.ExecuteNonQuery();
            }

            return Ok("Updated successfully");
        }

        [HttpPost("UploadDocument")]
        public async Task<IActionResult> UploadDocument(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File not uploaded");

            var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/Uploads");
            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            string path = Path.Combine(folder, fileName);

            using (var stream = new FileStream(path, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { filePath = "/Uploads/" + fileName });
        }

        [HttpGet("sp_GetDepartment")]
        public string Sp_GetDepartments()
        {
            using SqlConnection con = new SqlConnection(connectionString);
            using SqlCommand cmd = new SqlCommand("sp_GetDepartment", con);

            cmd.CommandType = CommandType.StoredProcedure;
            con.Open();

            DataTable dt = new DataTable();
            dt.Load(cmd.ExecuteReader());

            return JsonConvert.SerializeObject(dt);
        }

        [HttpDelete("DeleteStudent/{id}")]
        public IActionResult DeleteStudent(int id)
        {
            int rows = 0;

            using (SqlConnection con = new SqlConnection(connectionString))
            using (SqlCommand cmd = new SqlCommand("sp_DeleteStudent", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@StudentID", id);

                con.Open();
                rows = cmd.ExecuteNonQuery();
            }

            if (rows > 0)
                return Ok(new { Message = "Student Deleted Successfully" });

            return BadRequest(new { Message = "Delete Failed" });
        }
    }
}
