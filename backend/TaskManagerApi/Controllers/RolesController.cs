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
                // Task Permissions
                CanViewAllTasks = r.CanViewAllTasks,
                CanEditAllTasks = r.CanEditAllTasks,
                CanCreateTasks = r.CanCreateTasks,
                CanDeleteTasks = r.CanDeleteTasks,
                CanAssignTasks = r.CanAssignTasks,
                // User Permissions
                CanViewAllUsers = r.CanViewAllUsers,
                CanCreateUsers = r.CanCreateUsers,
                CanEditUsers = r.CanEditUsers,
                CanDeleteUsers = r.CanDeleteUsers,
                // System Permissions
                CanManageRoles = r.CanManageRoles,
                CanManagePermissions = r.CanManagePermissions,
                CanViewReports = r.CanViewReports,
                CanExportData = r.CanExportData,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
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
                // Task Permissions
                CanViewAllTasks = role.CanViewAllTasks,
                CanEditAllTasks = role.CanEditAllTasks,
                CanCreateTasks = role.CanCreateTasks,
                CanDeleteTasks = role.CanDeleteTasks,
                CanAssignTasks = role.CanAssignTasks,
                // User Permissions
                CanViewAllUsers = role.CanViewAllUsers,
                CanCreateUsers = role.CanCreateUsers,
                CanEditUsers = role.CanEditUsers,
                CanDeleteUsers = role.CanDeleteUsers,
                // System Permissions
                CanManageRoles = role.CanManageRoles,
                CanManagePermissions = role.CanManagePermissions,
                CanViewReports = role.CanViewReports,
                CanExportData = role.CanExportData,
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt,
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
                // Task Permissions
                CanViewAllTasks = dto.CanViewAllTasks,
                CanEditAllTasks = dto.CanEditAllTasks,
                CanCreateTasks = dto.CanCreateTasks,
                CanDeleteTasks = dto.CanDeleteTasks,
                CanAssignTasks = dto.CanAssignTasks,
                // User Permissions
                CanViewAllUsers = dto.CanViewAllUsers,
                CanCreateUsers = dto.CanCreateUsers,
                CanEditUsers = dto.CanEditUsers,
                CanDeleteUsers = dto.CanDeleteUsers,
                // System Permissions
                CanManageRoles = dto.CanManageRoles,
                CanManagePermissions = dto.CanManagePermissions,
                CanViewReports = dto.CanViewReports,
                CanExportData = dto.CanExportData,
                CreatedAt = DateTime.UtcNow
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            var roleDto = new RoleDto
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                // Task Permissions
                CanViewAllTasks = role.CanViewAllTasks,
                CanEditAllTasks = role.CanEditAllTasks,
                CanCreateTasks = role.CanCreateTasks,
                CanDeleteTasks = role.CanDeleteTasks,
                CanAssignTasks = role.CanAssignTasks,
                // User Permissions
                CanViewAllUsers = role.CanViewAllUsers,
                CanCreateUsers = role.CanCreateUsers,
                CanEditUsers = role.CanEditUsers,
                CanDeleteUsers = role.CanDeleteUsers,
                // System Permissions
                CanManageRoles = role.CanManageRoles,
                CanManagePermissions = role.CanManagePermissions,
                CanViewReports = role.CanViewReports,
                CanExportData = role.CanExportData,
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

            // Don't allow modifying default roles (Admin, Director, Division, User)
            if (id <= 4)
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

            // Update Task Permissions
            if (dto.CanViewAllTasks.HasValue)
                role.CanViewAllTasks = dto.CanViewAllTasks.Value;
            if (dto.CanEditAllTasks.HasValue)
                role.CanEditAllTasks = dto.CanEditAllTasks.Value;
            if (dto.CanCreateTasks.HasValue)
                role.CanCreateTasks = dto.CanCreateTasks.Value;
            if (dto.CanDeleteTasks.HasValue)
                role.CanDeleteTasks = dto.CanDeleteTasks.Value;
            if (dto.CanAssignTasks.HasValue)
                role.CanAssignTasks = dto.CanAssignTasks.Value;

            // Update User Permissions
            if (dto.CanViewAllUsers.HasValue)
                role.CanViewAllUsers = dto.CanViewAllUsers.Value;
            if (dto.CanCreateUsers.HasValue)
                role.CanCreateUsers = dto.CanCreateUsers.Value;
            if (dto.CanEditUsers.HasValue)
                role.CanEditUsers = dto.CanEditUsers.Value;
            if (dto.CanDeleteUsers.HasValue)
                role.CanDeleteUsers = dto.CanDeleteUsers.Value;

            // Update System Permissions
            if (dto.CanManageRoles.HasValue)
                role.CanManageRoles = dto.CanManageRoles.Value;
            if (dto.CanManagePermissions.HasValue)
                role.CanManagePermissions = dto.CanManagePermissions.Value;
            if (dto.CanViewReports.HasValue)
                role.CanViewReports = dto.CanViewReports.Value;
            if (dto.CanExportData.HasValue)
                role.CanExportData = dto.CanExportData.Value;

            role.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var roleDto = new RoleDto
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                // Task Permissions
                CanViewAllTasks = role.CanViewAllTasks,
                CanEditAllTasks = role.CanEditAllTasks,
                CanCreateTasks = role.CanCreateTasks,
                CanDeleteTasks = role.CanDeleteTasks,
                CanAssignTasks = role.CanAssignTasks,
                // User Permissions
                CanViewAllUsers = role.CanViewAllUsers,
                CanCreateUsers = role.CanCreateUsers,
                CanEditUsers = role.CanEditUsers,
                CanDeleteUsers = role.CanDeleteUsers,
                // System Permissions
                CanManageRoles = role.CanManageRoles,
                CanManagePermissions = role.CanManagePermissions,
                CanViewReports = role.CanViewReports,
                CanExportData = role.CanExportData,
                CreatedAt = role.CreatedAt,
                UpdatedAt = role.UpdatedAt,
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
            // Don't allow deleting default roles (Admin, Director, Division, User)
            if (id <= 4)
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

    // GET: api/roles/{id}/permissions
    [HttpGet("{id}/permissions")]
    public async Task<IActionResult> GetRolePermissions(int id)
    {
        try
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
                return NotFound(new { message = "Role not found" });

            var permissions = new RolePermissionsDto
            {
                RoleId = role.Id,
                RoleName = role.Name,
                // Task Permissions
                CanViewAllTasks = role.CanViewAllTasks,
                CanEditAllTasks = role.CanEditAllTasks,
                CanCreateTasks = role.CanCreateTasks,
                CanDeleteTasks = role.CanDeleteTasks,
                CanAssignTasks = role.CanAssignTasks,
                // User Permissions
                CanViewAllUsers = role.CanViewAllUsers,
                CanCreateUsers = role.CanCreateUsers,
                CanEditUsers = role.CanEditUsers,
                CanDeleteUsers = role.CanDeleteUsers,
                // System Permissions
                CanManageRoles = role.CanManageRoles,
                CanManagePermissions = role.CanManagePermissions,
                CanViewReports = role.CanViewReports,
                CanExportData = role.CanExportData
            };

            return Ok(permissions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving role permissions", error = ex.Message });
        }
    }

    // PUT: api/roles/{id}/permissions
    [HttpPut("{id}/permissions")]
    public async Task<IActionResult> UpdateRolePermissions(int id, [FromBody] UpdateRolePermissionsDto dto)
    {
        try
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
                return NotFound(new { message = "Role not found" });

            // Prevent modifying default roles if needed (optional)
            // if (id <= 4) return BadRequest(new { message = "Cannot modify default role permissions" });

            // Update all permissions
            role.CanViewAllTasks = dto.CanViewAllTasks;
            role.CanEditAllTasks = dto.CanEditAllTasks;
            role.CanCreateTasks = dto.CanCreateTasks;
            role.CanDeleteTasks = dto.CanDeleteTasks;
            role.CanAssignTasks = dto.CanAssignTasks;
            role.CanViewAllUsers = dto.CanViewAllUsers;
            role.CanCreateUsers = dto.CanCreateUsers;
            role.CanEditUsers = dto.CanEditUsers;
            role.CanDeleteUsers = dto.CanDeleteUsers;
            role.CanManageRoles = dto.CanManageRoles;
            role.CanManagePermissions = dto.CanManagePermissions;
            role.CanViewReports = dto.CanViewReports;
            role.CanExportData = dto.CanExportData;
            
            role.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Role permissions updated successfully",
                roleId = role.Id,
                roleName = role.Name
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating role permissions", error = ex.Message });
        }
    }
}