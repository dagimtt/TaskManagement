// Controllers/RolesController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagerApi.Data;
using TaskManagerApi.DTOs;
using TaskManagerApi.Models;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class RolesController : ControllerBase
{
    private readonly AppDbContext _context;

    public RolesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/roles
    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        try
        {
            var roles = await _context.Roles
                .Include(r => r.Users)
                .OrderBy(r => r.Id)
                .ToListAsync();

            var roleDtos = roles.Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                CanViewAllTasks = r.CanViewAllTasks,
                CanEditAllTasks = r.CanEditAllTasks,
                CanManageUsers = r.CanManageUsers,
                CanManageRoles = r.CanManageRoles,
                CreatedAt = r.CreatedAt,
                UserCount = r.Users?.Count ?? 0
            }).ToList();

            return Ok(roleDtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving roles", error = ex.Message });
        }
    }

    // GET: api/roles/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetRole(int id)
    {
        try
        {
            var role = await _context.Roles
                .Include(r => r.Users)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null)
                return NotFound(new { message = "Role not found" });

            var roleDto = new RoleDto
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                CanViewAllTasks = role.CanViewAllTasks,
                CanEditAllTasks = role.CanEditAllTasks,
                CanManageUsers = role.CanManageUsers,
                CanManageRoles = role.CanManageRoles,
                CreatedAt = role.CreatedAt,
                UserCount = role.Users?.Count ?? 0
            };

            return Ok(roleDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving role", error = ex.Message });
        }
    }

    // POST: api/roles
    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Role name is required" });

            // Check if role name already exists
            if (await _context.Roles.AnyAsync(r => r.Name == dto.Name))
                return BadRequest(new { message = "Role name already exists" });

            var role = new Role
            {
                Name = dto.Name,
                Description = dto.Description,
                CanViewAllTasks = dto.CanViewAllTasks,
                CanEditAllTasks = dto.CanEditAllTasks,
                CanManageUsers = dto.CanManageUsers,
                CanManageRoles = dto.CanManageRoles,
                CreatedAt = DateTime.UtcNow
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            var roleDto = new RoleDto
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                CanViewAllTasks = role.CanViewAllTasks,
                CanEditAllTasks = role.CanEditAllTasks,
                CanManageUsers = role.CanManageUsers,
                CanManageRoles = role.CanManageRoles,
                CreatedAt = role.CreatedAt,
                UserCount = 0
            };

            return CreatedAtAction(nameof(GetRole), new { id = role.Id }, roleDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error creating role", error = ex.Message });
        }
    }

    // PUT: api/roles/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleDto dto)
    {
        try
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
                return NotFound(new { message = "Role not found" });

            // Don't allow modifying default roles
            if (id <= 3) // Admin, Manager, User
                return BadRequest(new { message = "Cannot modify default roles" });

            // Update fields if provided
            if (!string.IsNullOrWhiteSpace(dto.Name) && dto.Name != role.Name)
            {
                // Check if new name already exists
                if (await _context.Roles.AnyAsync(r => r.Name == dto.Name && r.Id != id))
                    return BadRequest(new { message = "Role name already exists" });

                role.Name = dto.Name;
            }

            if (dto.Description != null)
                role.Description = dto.Description;

            if (dto.CanViewAllTasks.HasValue)
                role.CanViewAllTasks = dto.CanViewAllTasks.Value;

            if (dto.CanEditAllTasks.HasValue)
                role.CanEditAllTasks = dto.CanEditAllTasks.Value;

            if (dto.CanManageUsers.HasValue)
                role.CanManageUsers = dto.CanManageUsers.Value;

            if (dto.CanManageRoles.HasValue)
                role.CanManageRoles = dto.CanManageRoles.Value;

            await _context.SaveChangesAsync();

            var roleDto = new RoleDto
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                CanViewAllTasks = role.CanViewAllTasks,
                CanEditAllTasks = role.CanEditAllTasks,
                CanManageUsers = role.CanManageUsers,
                CanManageRoles = role.CanManageRoles,
                CreatedAt = role.CreatedAt,
                UserCount = await _context.Users.CountAsync(u => u.RoleId == id)
            };

            return Ok(roleDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating role", error = ex.Message });
        }
    }

    // DELETE: api/roles/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRole(int id)
    {
        try
        {
            // Don't allow deleting default roles
            if (id <= 3)
                return BadRequest(new { message = "Cannot delete default roles" });

            var role = await _context.Roles
                .Include(r => r.Users)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null)
                return NotFound(new { message = "Role not found" });

            // Check if role has users
            if (role.Users?.Any() == true)
                return BadRequest(new { message = "Cannot delete role that has users assigned. Reassign users first." });

            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Role deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error deleting role", error = ex.Message });
        }
    }
}