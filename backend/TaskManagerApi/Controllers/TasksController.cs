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
    private readonly ILogger<TasksController> _logger;

    public TasksController(AppDbContext context, ILogger<TasksController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Helper method to ensure DateTime is UTC
    private DateTime EnsureUtc(DateTime dateTime)
    {
        if (dateTime.Kind == DateTimeKind.Utc)
            return dateTime;
        if (dateTime.Kind == DateTimeKind.Local)
            return dateTime.ToUniversalTime();
        // If Unspecified, assume it's UTC
        return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
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

            // FIXED: Add .ThenInclude for Role
            var query = _context.Tasks
                .Include(t => t.AssignedUsers)
                    .ThenInclude(u => u.Role) // ← CRITICAL FIX
                .Include(t => t.CreatedBy)
                    .ThenInclude(u => u.Role) // ← CRITICAL FIX
                .Where(t => !t.IsDeleted);

            // Apply role-based filtering
            if (currentUserRole != "Admin" && currentUserRole != "Manager")
            {
                // Regular users can only see tasks assigned to them or created by them
                query = query.Where(t => 
                    t.AssignedUsers.Any(u => u.Id == currentUserId) || 
                    t.CreatedById == currentUserId);
            }

            // Apply filters
            if (!string.IsNullOrEmpty(status))
                query = query.Where(t => t.Status == status);

            if (!string.IsNullOrEmpty(priority))
                query = query.Where(t => t.Priority == priority);

            if (assignedTo.HasValue)
                query = query.Where(t => t.AssignedUsers.Any(u => u.Id == assignedTo.Value));

            if (!string.IsNullOrEmpty(search))
                query = query.Where(t => 
                    t.Title.Contains(search) || 
                    (t.Description != null && t.Description.Contains(search)) ||
                    (t.Category != null && t.Category.Contains(search)));

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

            // Map to DTO with null checks
            var taskDtos = tasks.Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                Priority = t.Priority,
                Category = t.Category,
                // FIXED: Added null checks
                AssignedUsers = t.AssignedUsers?.Select(u => new UserSimpleDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role?.Name ?? "No Role" // Null check
                }).ToList() ?? new List<UserSimpleDto>(),
                CreatedById = t.CreatedById,
                CreatedByName = t.CreatedBy?.FullName ?? "Unknown",
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
            _logger.LogError(ex, "Error retrieving tasks");
            return StatusCode(500, new { 
                message = "Error retrieving tasks", 
                error = ex.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }

    // GET: api/tasks/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTask(int id)
    {
        try
        {
            // FIXED: Add .ThenInclude for Role
            var task = await _context.Tasks
                .Include(t => t.AssignedUsers)
                    .ThenInclude(u => u.Role) // ← CRITICAL FIX
                .Include(t => t.CreatedBy)
                    .ThenInclude(u => u.Role) // ← CRITICAL FIX
                .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);

            if (task == null)
                return NotFound(new { message = "Task not found" });

            // Check permissions
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserRole != "Admin" && currentUserRole != "Manager" &&
                !task.AssignedUsers.Any(u => u.Id == currentUserId) && 
                task.CreatedById != currentUserId)
                return Forbid();

            var taskDto = new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status,
                Priority = task.Priority,
                Category = task.Category,
                // FIXED: Added null checks
                AssignedUsers = task.AssignedUsers?.Select(u => new UserSimpleDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role?.Name ?? "No Role" // Null check
                }).ToList() ?? new List<UserSimpleDto>(),
                CreatedById = task.CreatedById,
                CreatedByName = task.CreatedBy?.FullName ?? "Unknown",
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
            _logger.LogError(ex, "Error retrieving task with ID: {TaskId}", id);
            return StatusCode(500, new { 
                message = "Error retrieving task", 
                error = ex.Message,
                stackTrace = ex.StackTrace 
            });
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

            // Check if assigned users exist
            var assignedUsers = new List<User>();
            if (dto.AssignedUserIds != null && dto.AssignedUserIds.Any())
            {
                assignedUsers = await _context.Users
                    .Include(u => u.Role) // Include Role
                    .Where(u => dto.AssignedUserIds.Contains(u.Id) && u.IsActive)
                    .ToListAsync();

                if (assignedUsers.Count != dto.AssignedUserIds.Count)
                    return BadRequest(new { message = "One or more assigned users not found or inactive" });
            }

            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                Status = "Pending",
                Priority = dto.Priority,
                CreatedById = currentUserId,
                // FIX: Ensure DueDate is UTC
                DueDate = EnsureUtc(dto.DueDate),
                Category = dto.Category,
                EstimatedHours = dto.EstimatedHours,
                CreatedAt = DateTime.UtcNow,
                AssignedUsers = assignedUsers  // Assign multiple users
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // Get the created task with relations
            var createdTask = await _context.Tasks
                .Include(t => t.AssignedUsers)
                    .ThenInclude(u => u.Role)
                .Include(t => t.CreatedBy)
                    .ThenInclude(u => u.Role) // ← ADDED THIS
                .FirstOrDefaultAsync(t => t.Id == task.Id);

            var taskDto = new TaskDto
            {
                Id = createdTask.Id,
                Title = createdTask.Title,
                Description = createdTask.Description,
                Status = createdTask.Status,
                Priority = createdTask.Priority,
                Category = createdTask.Category,
                // Updated for multiple users
                AssignedUsers = createdTask.AssignedUsers.Select(u => new UserSimpleDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role?.Name ?? "No Role" // Null check
                }).ToList(),
                CreatedById = createdTask.CreatedById,
                CreatedByName = createdTask.CreatedBy?.FullName ?? "Unknown",
                DueDate = createdTask.DueDate,
                CreatedAt = createdTask.CreatedAt,
                EstimatedHours = createdTask.EstimatedHours
            };

            return CreatedAtAction(nameof(GetTask), new { id = task.Id }, taskDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating task");
            return StatusCode(500, new { 
                message = "Error creating task", 
                error = ex.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }

    // PUT: api/tasks/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto dto)
    {
        try
        {
            // FIXED: Add .ThenInclude for Role
            var task = await _context.Tasks
                .Include(t => t.AssignedUsers)
                    .ThenInclude(u => u.Role) // ← CRITICAL FIX
                .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
                
            if (task == null)
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

            // Update assigned users if provided
            if (dto.AssignedUserIds != null)
            {
                // Clear existing assigned users
                task.AssignedUsers.Clear();
                
                // Add new assigned users
                if (dto.AssignedUserIds.Any())
                {
                    var assignedUsers = await _context.Users
                        .Include(u => u.Role) // Include Role
                        .Where(u => dto.AssignedUserIds.Contains(u.Id) && u.IsActive)
                        .ToListAsync();

                    if (assignedUsers.Count != dto.AssignedUserIds.Count)
                        return BadRequest(new { message = "One or more assigned users not found or inactive" });

                    foreach (var user in assignedUsers)
                    {
                        task.AssignedUsers.Add(user);
                    }
                }
            }

            if (dto.DueDate.HasValue)
            {
                // FIX: Ensure DueDate is UTC
                task.DueDate = EnsureUtc(dto.DueDate.Value);
            }

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
                .Include(t => t.AssignedUsers)
                    .ThenInclude(u => u.Role)
                .Include(t => t.CreatedBy)
                    .ThenInclude(u => u.Role) // ← ADDED THIS
                .FirstOrDefaultAsync(t => t.Id == id);

            var taskDto = new TaskDto
            {
                Id = updatedTask.Id,
                Title = updatedTask.Title,
                Description = updatedTask.Description,
                Status = updatedTask.Status,
                Priority = updatedTask.Priority,
                Category = updatedTask.Category,
                // Updated for multiple users
                AssignedUsers = updatedTask.AssignedUsers.Select(u => new UserSimpleDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role?.Name ?? "No Role" // Null check
                }).ToList(),
                CreatedById = updatedTask.CreatedById,
                CreatedByName = updatedTask.CreatedBy?.FullName ?? "Unknown",
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
            _logger.LogError(ex, "Error updating task with ID: {TaskId}", id);
            return StatusCode(500, new { 
                message = "Error updating task", 
                error = ex.Message,
                stackTrace = ex.StackTrace 
            });
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
            _logger.LogError(ex, "Error deleting task with ID: {TaskId}", id);
            return StatusCode(500, new { 
                message = "Error deleting task", 
                error = ex.Message,
                stackTrace = ex.StackTrace 
            });
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

            IQueryable<TaskItem> query = _context.Tasks
                .Include(t => t.AssignedUsers)
                    .ThenInclude(u => u.Role) // ← ADDED THIS
                .Where(t => !t.IsDeleted);

            // Apply role-based filtering
            if (currentUserRole != "Admin" && currentUserRole != "Manager")
            {
                query = query.Where(t => 
                    t.AssignedUsers.Any(u => u.Id == currentUserId) || 
                    t.CreatedById == currentUserId);
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

            // Get user tasks data for chart
            var userTasksData = await _context.Users
                .Include(u => u.AssignedTasks)
                .Include(u => u.Role) // Include Role
                .Where(u => u.IsActive)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Username,
                    TaskCount = u.AssignedTasks.Count(t => !t.IsDeleted),
                    CompletedTasks = u.AssignedTasks.Count(t => !t.IsDeleted && t.Status == "Completed"),
                    PendingTasks = u.AssignedTasks.Count(t => !t.IsDeleted && t.Status != "Completed")
                })
                .Where(u => u.TaskCount > 0)
                .OrderByDescending(u => u.TaskCount)
                .Take(10) // Limit to top 10 users
                .ToListAsync();

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
                completionRate = totalTasks > 0 ? (double)completedTasks / totalTasks * 100 : 0,
                userTasksData // Add this for the dashboard chart
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting task statistics");
            return StatusCode(500, new { 
                message = "Error getting task statistics", 
                error = ex.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }

    // TEST ENDPOINT - For debugging only
    [HttpGet("test/debug")]
    public async Task<IActionResult> DebugTest()
    {
        try
        {
            // Test 1: Simple count
            var totalTasks = await _context.Tasks.CountAsync();
            
            // Test 2: Check if Role table has data
            var roles = await _context.Roles.ToListAsync();
            
            // Test 3: Try a simple query with includes
            var testTask = await _context.Tasks
                .Include(t => t.AssignedUsers)
                    .ThenInclude(u => u.Role)
                .Include(t => t.CreatedBy)
                    .ThenInclude(u => u.Role)
                .FirstOrDefaultAsync(t => t.Id == 1);
            
            return Ok(new
            {
                totalTasks,
                roleCount = roles.Count,
                testTask = testTask != null ? new
                {
                    testTask.Id,
                    testTask.Title,
                    HasAssignedUsers = testTask.AssignedUsers?.Count ?? 0,
                    FirstUserRole = testTask.AssignedUsers?.FirstOrDefault()?.Role?.Name
                } : null,
                message = "Debug endpoint working"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Debug test failed",
                error = ex.Message,
                innerError = ex.InnerException?.Message,
                stackTrace = ex.StackTrace
            });
        }
    }
}