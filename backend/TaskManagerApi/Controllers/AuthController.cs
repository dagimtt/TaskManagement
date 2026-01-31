// Controllers/AuthController.cs
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagerApi.Data;
using TaskManagerApi.DTOs;
using TaskManagerApi.Helpers;
using TaskManagerApi.Models;
namespace TaskManagerApi.Controllers
{
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { message = "Username and password are required" });

            // Find user with role
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Username == dto.Username);

            if (user == null || !user.IsActive)
                return Unauthorized(new { message = "Invalid username or password" });

            // Verify password (plain text comparison for now - update to hashing!)
            if (user.PasswordHash != dto.Password) // TODO: Replace with BCrypt
                return Unauthorized(new { message = "Invalid username or password" });

            // Generate JWT token
            var token = JwtHelper.GenerateToken(user, _config["Jwt:Key"]!);

            // Return user info with token
            return Ok(new
            {
                token,
                user = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role?.Name ?? "User",
                    RoleId = user.RoleId,
                    CreatedAt = user.CreatedAt,
                    IsActive = user.IsActive
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during login", error = ex.Message });
        }
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin,Manager")] // Only admins and managers can register users
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(dto.FullName))
                return BadRequest(new { message = "Full name is required" });
            
            if (string.IsNullOrWhiteSpace(dto.Username))
                return BadRequest(new { message = "Username is required" });
            
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "Email is required" });
            
            if (!IsValidEmail(dto.Email))
                return BadRequest(new { message = "Invalid email format" });
            
            if (string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { message = "Password is required" });

            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                return BadRequest(new { message = "Username already exists" });

            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest(new { message = "Email already exists" });

            // Get role (default to User if not specified or if requester is not admin)
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var roleId = dto.RoleId;

            // Non-admins can only create Users
            if (currentUserRole != "Admin" && roleId != 3)
                roleId = 3;

            var role = await _context.Roles.FindAsync(roleId);
            if (role == null)
                return BadRequest(new { message = "Invalid role specified" });

            // Create new user
            var user = new User
            {
                FullName = dto.FullName,
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = dto.Password, // TODO: Hash password using BCrypt
                RoleId = roleId,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Return created user info
            return Ok(new
            {
                message = "User registered successfully",
                user = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Username = user.Username,
                    Email = user.Email,
                    Role = role.Name,
                    RoleId = role.Id,
                    CreatedAt = user.CreatedAt,
                    IsActive = user.IsActive
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Registration failed", error = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

            if (user == null)
                return Unauthorized();

            return Ok(new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role?.Name ?? "User",
                RoleId = user.RoleId,
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get user information", error = ex.Message });
        }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return Unauthorized();

            // Verify current password
            if (user.PasswordHash != dto.CurrentPassword) // TODO: Use BCrypt
                return BadRequest(new { message = "Current password is incorrect" });

            // Update password
            user.PasswordHash = dto.NewPassword; // TODO: Hash password
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to change password", error = ex.Message });
        }
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}
}