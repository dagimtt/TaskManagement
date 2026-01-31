// Controllers/SimpleAuthController.cs
using Microsoft.AspNetCore.Mvc;

namespace TaskManagerApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SimpleAuthController : ControllerBase
    {
        [HttpPost("login")]
        public IActionResult Login([FromBody] object credentials)
        {
            return Ok(new {
                token = "test-jwt-token-12345",
                user = new {
                    id = 1,
                    username = "admin",
                    fullName = "Administrator",
                    role = "Admin"
                }
            });
        }
    }
}