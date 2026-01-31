// Controllers/TasksController.cs
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
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    public TasksController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/tasks
    [HttpGet]
    public async Task<IActionResult> GetTasks(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] int? assignedTo,
        [FromQuery] string? search,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] string? sortOrder = "desc")
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            // Start building query
            var query = _context.Tasks
                .Include(t => t.AssignedTo)
                .Include(t => t.CreatedBy)
                .Where(t => !t.IsDeleted);

            // Apply role-based filtering
            if (currentUserRole != "Admin" && currentUserRole != "Manager")
            {
                // Regular users can only see tasks assigned to them or created by them
                query = query.Where(t => t.AssignedToId == currentUserId || t.CreatedById == currentUserId);
            }

            // Apply filters
            if (!string.IsNullOrEmpty(status))
                query = query.Where(t => t.Status == status);

            if (!string.IsNullOrEmpty(priority))
                query = query.Where(t => t.Priority == priority);

            if (assignedTo.HasValue)
                query = query.Where(t => t.AssignedToId == assignedTo);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(t => 
                    t.Title.Contains(search) || 
                    t.Description.Contains(search) ||
                    t.Category.Contains(search));

            // Apply sorting
            query = sortBy.ToLower() switch
            {
                "duedate" => sortOrder == "asc" ? 
                    query.OrderBy(t => t.DueDate) : 
                    query.OrderByDescending(t => t.DueDate),
                "priority" => sortOrder == "asc" ? 
                    query.OrderBy(t => t.Priority) : 
                    query.OrderByDescending(t => t.Priority),
                "status" => sortOrder == "asc" ? 
                    query.OrderBy(t => t.Status) : 
                    query.OrderByDescending(t => t.Status),
                _ => sortOrder == "asc" ? 
                    query.OrderBy(t => t.CreatedAt) : 
                    query.OrderByDescending(t => t.CreatedAt)
            };

            var tasks = await query.ToListAsync();

            // Map to DTO
            var taskDtos = tasks.Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                Priority = t.Priority,
                Category = t.Category,
                AssignedToId = t.AssignedToId,
                AssignedToName = t.AssignedTo?.FullName,
                CreatedById = t.CreatedById,
                CreatedByName = t.CreatedBy?.FullName,
                DueDate = t.DueDate,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                CompletedAt = t.CompletedAt,
                EstimatedHours = t.EstimatedHours,
                ActualHours = t.ActualHours
            }).ToList();

            return Ok(taskDtos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving tasks", error = ex.Message });
        }
    }

    // GET: api/tasks/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTask(int id)
    {
        try
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedTo)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

            if (task == null)
                return NotFound(new { message = "Task not found" });

            // Check permissions
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserRole != "Admin" && currentUserRole != "Manager" &&
                task.AssignedToId != currentUserId && task.CreatedById != currentUserId)
                return Forbid();

            var taskDto = new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status,
                Priority = task.Priority,
                Category = task.Category,
                AssignedToId = task.AssignedToId,
                AssignedToName = task.AssignedTo?.FullName,
                CreatedById = task.CreatedById,
                CreatedByName = task.CreatedBy?.FullName,
                DueDate = task.DueDate,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                CompletedAt = task.CompletedAt,
                EstimatedHours = task.EstimatedHours,
                ActualHours = task.ActualHours
            };

            return Ok(taskDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error retrieving task", error = ex.Message });
        }
    }

    // POST: api/tasks
    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto dto)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { message = "Title is required" });

            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);

            // Check if assigned user exists
            if (dto.AssignedToId.HasValue)
            {
                var assignedUser = await _context.Users.FindAsync(dto.AssignedToId.Value);
                if (assignedUser == null || !assignedUser.IsActive)
                    return BadRequest(new { message = "Assigned user not found or inactive" });
            }

            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                Status = "Pending",
                Priority = dto.Priority,
                AssignedToId = dto.AssignedToId,
                CreatedById = currentUserId,
                DueDate = dto.DueDate,
                Category = dto.Category,
                EstimatedHours = dto.EstimatedHours,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // Get the created task with relations
            var createdTask = await _context.Tasks
                .Include(t => t.AssignedTo)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == task.Id);

            var taskDto = new TaskDto
            {
                Id = createdTask.Id,
                Title = createdTask.Title,
                Description = createdTask.Description,
                Status = createdTask.Status,
                Priority = createdTask.Priority,
                Category = createdTask.Category,
                AssignedToId = createdTask.AssignedToId,
                AssignedToName = createdTask.AssignedTo?.FullName,
                CreatedById = createdTask.CreatedById,
                CreatedByName = createdTask.CreatedBy?.FullName,
                DueDate = createdTask.DueDate,
                CreatedAt = createdTask.CreatedAt,
                EstimatedHours = createdTask.EstimatedHours
            };

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, taskDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error creating task", error = ex.Message });
        }
    }

    // PUT: api/tasks/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto dto)
    {
        try
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null || task.IsDeleted)
                return NotFound(new { message = "Task not found" });

            // Check permissions
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var canEdit = currentUserRole == "Admin" || 
                         currentUserRole == "Manager" || 
                         task.CreatedById == currentUserId;

            if (!canEdit)
                return Forbid();

            // Update fields if provided
            if (!string.IsNullOrWhiteSpace(dto.Title))
                task.Title = dto.Title;

            if (dto.Description != null)
                task.Description = dto.Description;

            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                task.Status = dto.Status;
                if (dto.Status == "Completed" && task.CompletedAt == null)
                    task.CompletedAt = DateTime.UtcNow;
                else if (dto.Status != "Completed")
                    task.CompletedAt = null;
            }

            if (!string.IsNullOrWhiteSpace(dto.Priority))
                task.Priority = dto.Priority;

            if (dto.AssignedToId.HasValue)
            {
                var assignedUser = await _context.Users.FindAsync(dto.AssignedToId.Value);
                if (assignedUser == null || !assignedUser.IsActive)
                    return BadRequest(new { message = "Assigned user not found or inactive" });
                task.AssignedToId = dto.AssignedToId.Value;
            }

            if (dto.DueDate.HasValue)
                task.DueDate = dto.DueDate.Value;

            if (dto.Category != null)
                task.Category = dto.Category;

            if (dto.EstimatedHours.HasValue)
                task.EstimatedHours = dto.EstimatedHours;

            if (dto.ActualHours.HasValue)
                task.ActualHours = dto.ActualHours;

            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Get updated task with relations
            var updatedTask = await _context.Tasks
                .Include(t => t.AssignedTo)
                .Include(t => t.CreatedBy)
                .FirstOrDefaultAsync(t => t.Id == id);

            var taskDto = new TaskDto
            {
                Id = updatedTask.Id,
                Title = updatedTask.Title,
                Description = updatedTask.Description,
                Status = updatedTask.Status,
                Priority = updatedTask.Priority,
                Category = updatedTask.Category,
                AssignedToId = updatedTask.AssignedToId,
                AssignedToName = updatedTask.AssignedTo?.FullName,
                CreatedById = updatedTask.CreatedById,
                CreatedByName = updatedTask.CreatedBy?.FullName,
                DueDate = updatedTask.DueDate,
                CreatedAt = updatedTask.CreatedAt,
                UpdatedAt = updatedTask.UpdatedAt,
                CompletedAt = updatedTask.CompletedAt,
                EstimatedHours = updatedTask.EstimatedHours,
                ActualHours = updatedTask.ActualHours
            };

            return Ok(taskDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating task", error = ex.Message });
        }
    }

    // DELETE: api/tasks/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        try
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null || task.IsDeleted)
                return NotFound(new { message = "Task not found" });

            // Check permissions
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var canDelete = currentUserRole == "Admin" || 
                           currentUserRole == "Manager" || 
                           task.CreatedById == currentUserId;

            if (!canDelete)
                return Forbid();

            // Soft delete
            task.IsDeleted = true;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Task deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error deleting task", error = ex.Message });
        }
    }

    // GET: api/tasks/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetTaskStats()
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            IQueryable<TaskItem> query = _context.Tasks.Where(t => !t.IsDeleted);

            // Apply role-based filtering
            if (currentUserRole != "Admin" && currentUserRole != "Manager")
            {
                query = query.Where(t => t.AssignedToId == currentUserId || t.CreatedById == currentUserId);
            }

            var totalTasks = await query.CountAsync();
            var completedTasks = await query.CountAsync(t => t.Status == "Completed");
            var pendingTasks = await query.CountAsync(t => t.Status == "Pending");
            var inProgressTasks = await query.CountAsync(t => t.Status == "In Progress");

            var highPriorityTasks = await query.CountAsync(t => t.Priority == "High");
            var mediumPriorityTasks = await query.CountAsync(t => t.Priority == "Medium");
            var lowPriorityTasks = await query.CountAsync(t => t.Priority == "Low");

            var overdueTasks = await query.CountAsync(t => 
                t.Status != "Completed" && t.DueDate < DateTime.UtcNow);

            return Ok(new
            {
                totalTasks,
                completedTasks,
                pendingTasks,
                inProgressTasks,
                highPriorityTasks,
                mediumPriorityTasks,
                lowPriorityTasks,
                overdueTasks,
                completionRate = totalTasks > 0 ? (double)completedTasks / totalTasks * 100 : 0
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error getting task statistics", error = ex.Message });
        }
    }
}