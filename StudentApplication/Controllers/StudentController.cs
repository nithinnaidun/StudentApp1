using Amazon.S3.Transfer;
using Amazon.S3;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using StudentApplication.Controllers.Models;
using System.Data;
using System.Data.SqlClient;
using Amazon.S3.Model;

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
    [HttpPost("UploadToS3")]
    public async Task<IActionResult> UploadToS3([FromForm] S3UploadModel model)
    {
      var file = model.file;

      if (file == null)
        return BadRequest(new { message = "File missing" });

      string awsAccess = Request.Headers["awsAccess"];
      string awsSecret = Request.Headers["awsSecret"].ToString().Replace("%2B", "+");
      string awsBucket = Request.Headers["awsBucket"];

      if (string.IsNullOrEmpty(awsAccess) || string.IsNullOrEmpty(awsSecret) || string.IsNullOrEmpty(awsBucket))
        return BadRequest(new { message = "Missing AWS headers" });

      try
      {
        var s3 = new AmazonS3Client(awsAccess, awsSecret, Amazon.RegionEndpoint.APSouth1);

        var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);

        var req = new PutObjectRequest
        {
          BucketName = awsBucket,
          Key = $"StudentDocs/{fileName}",
          InputStream = file.OpenReadStream(),
          ContentType = file.ContentType,
         
        };

        await s3.PutObjectAsync(req);

        return Ok(new { filePath = $"https://{awsBucket}.s3.amazonaws.com/StudentDocs/{fileName}" });
      }
      catch (Exception ex)
      {
        return BadRequest(new { message = "S3 Upload Failed", error = ex.Message });
      }
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
            Department = Convert.ToInt32(rd["Department"]),
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
      int result = 0;

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
        cmd.Parameters.AddWithValue("@AddressProf", input.AddressProf ?? "");
        cmd.Parameters.AddWithValue("@DocumentPath", input.DocumentPath ?? "");

        con.Open();
        result = Convert.ToInt32(cmd.ExecuteScalar());
      }

      if (result == -1)
        return BadRequest(new { message = "Email already exists" });

      if (result == -2)
        return BadRequest(new { message = "Phone number already exists" });

      return Ok(new { message = "Student Inserted Successfully", newStudentID = result });
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
        cmd.Parameters.AddWithValue("@Department", Convert.ToInt32(model.Department));
        cmd.Parameters.AddWithValue("@Address", model.Address);
        cmd.Parameters.AddWithValue("@DocumentPath", model.DocumentPath ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@AddressProf", model.AddressProf ?? "");

        con.Open();
        var result = Convert.ToInt32(cmd.ExecuteScalar());

        if (result == -1)
          return BadRequest(new { message = "Email already exists" });

        if (result == -2)
          return BadRequest(new { message = "Phone number already exists" });

        return Ok(new { message = "Updated successfully" });
      }
    }

 




    [HttpPut("UpdateDocumentPath/{id}")]
    public IActionResult UpdateDocumentPath(int id, [FromBody] string documentPath)
    {
      if (string.IsNullOrWhiteSpace(documentPath))
        return BadRequest(new { message = "DocumentPath is required" });

      using (SqlConnection con = new SqlConnection(connectionString))
      using (SqlCommand cmd = new SqlCommand("sp_UpdateDocumentPath", con))
      {
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@StudentId", id);
        cmd.Parameters.AddWithValue("@DocumentPath", documentPath);

        con.Open();
        cmd.ExecuteNonQuery();
      }

      return Ok(new { message = "Document path updated successfully" });
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
        return Ok(new { message = "Student Deleted Successfully" });

      return BadRequest(new { message = "Delete Failed" });
    }

  }
}
