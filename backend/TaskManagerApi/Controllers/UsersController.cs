using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagerApi.Data;
using TaskManagerApi.DTOs;
using TaskManagerApi.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/users
    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetUsers([FromQuery] bool? active, [FromQuery] int? roleId)
    {
        try
        {
            var query = _context.Users
                .Include(u => u.Role)
                .AsQueryable();

            // Apply filters
            if (active.HasValue)
                query = query.Where(u => u.IsActive == active.Value);

            if (roleId.HasValue)
                query = query.Where(u => u.RoleId == roleId.Value);

            var users = await query
                .OrderBy(u => u.FullName)
                .ToListAsync();

            var userDtos = users.Select(u => new UserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role?.Name ?? "User",
                RoleId = u.RoleId,
                CreatedAt = u.CreatedAt,
                IsActive = u.IsActive
            }).ToList();

            return Ok(userDtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving users", error = ex.Message });
        }
    }

    // GET: api/users/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Users can only view their own profile unless they're Admin/Manager
            if (currentUserRole != "Admin" && currentUserRole != "Manager" && currentUserId != id)
                return Forbid();

            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Tasks.Where(t => !t.IsDeleted))
                .FirstOrDefaultAsync(u => u.Id == id && u.IsActive);

            if (user == null)
                return NotFound(new { message = "User not found" });

            // Return user info with tasks as an anonymous object
            return Ok(new
            {
                Id = user.Id,
                FullName = user.FullName,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role?.Name ?? "User",
                RoleId = user.RoleId,
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive,
                Tasks = user.Tasks?.Select(t => new
                {
                    Id = t.Id,
                    Title = t.Title,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    CreatedAt = t.CreatedAt
                }).ToList()
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving user", error = ex.Message });
        }
    }

    // PUT: api/users/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            // Users can only update their own profile unless they're Admin
            if (currentUserRole != "Admin" && currentUserId != id)
                return Forbid();

            // Check permissions for role update
            if (dto.RoleId.HasValue && dto.RoleId.Value != user.RoleId)
            {
                if (currentUserRole != "Admin")
                    return Forbid("Only admins can change user roles");

                var role = await _context.Roles.FindAsync(dto.RoleId.Value);
                if (role == null)
                    return BadRequest(new { message = "Invalid role specified" });

                user.RoleId = dto.RoleId.Value;
            }

            // Update other fields
            if (!string.IsNullOrWhiteSpace(dto.FullName))
                user.FullName = dto.FullName;

            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                // Check if email is already taken by another user
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
                    return BadRequest(new { message = "Email already in use" });

                user.Email = dto.Email;
            }

            if (dto.IsActive.HasValue && currentUserRole == "Admin")
                user.IsActive = dto.IsActive.Value;

            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Get updated user with role
            var updatedUser = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            var userDto = new UserDto
            {
                Id = updatedUser.Id,
                FullName = updatedUser.FullName,
                Username = updatedUser.Username,
                Email = updatedUser.Email,
                Role = updatedUser.Role?.Name ?? "User",
                RoleId = updatedUser.RoleId,
                CreatedAt = updatedUser.CreatedAt,
                IsActive = updatedUser.IsActive
            };

            return Ok(userDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating user", error = ex.Message });
        }
    }

    // DELETE: api/users/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            // Prevent deleting yourself
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            if (currentUserId == id)
                return BadRequest(new { message = "Cannot delete your own account" });

            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            // Check if user has any active tasks
            var hasActiveTasks = await _context.Tasks
                .AnyAsync(t => t.AssignedToId == id && !t.IsDeleted && t.Status != "Completed");

            if (hasActiveTasks)
                return BadRequest(new { message = "User has active tasks. Reassign or complete them first." });

            // Soft delete (deactivate)
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "User deactivated successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
        }
    }

    // GET: api/users/stats
    [HttpGet("stats")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetUserStats()
    {
        try
        {
            var totalUsers = await _context.Users.CountAsync(u => u.IsActive);
            var totalAdmins = await _context.Users
                .Include(u => u.Role)
                .CountAsync(u => u.IsActive && u.Role.Name == "Admin");
            var totalManagers = await _context.Users
                .Include(u => u.Role)
                .CountAsync(u => u.IsActive && u.Role.Name == "Manager");
            var totalRegularUsers = await _context.Users
                .Include(u => u.Role)
                .CountAsync(u => u.IsActive && u.Role.Name == "User");

            // Users with most tasks
            var topUsers = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Tasks.Where(t => !t.IsDeleted))
                .Where(u => u.IsActive)
                .OrderByDescending(u => u.Tasks.Count)
                .Take(5)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Role.Name,
                    TaskCount = u.Tasks.Count,
                    CompletedTasks = u.Tasks.Count(t => t.Status == "Completed")
                })
                .ToListAsync();

            return Ok(new
            {
                totalUsers,
                totalAdmins,
                totalManagers,
                totalRegularUsers,
                topUsers
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error getting user statistics", error = ex.Message });
        }
    }
}