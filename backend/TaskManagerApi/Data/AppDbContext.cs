using Microsoft.EntityFrameworkCore;
using TaskManagerApi.Models;

namespace TaskManagerApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User - Role relationship
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Task - User relationship (AssignedTo)
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.AssignedTo)
                .WithMany(u => u.Tasks)
                .HasForeignKey(t => t.AssignedToId)
                .OnDelete(DeleteBehavior.SetNull);

            // Task - User relationship (CreatedBy)
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.CreatedBy)
                .WithMany()
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure indexes for better performance
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.Status);

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.Priority);

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.DueDate);

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Use STATIC dates - NOT DateTime.UtcNow
            var baseDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            
            // Seed roles with ALL 14 permissions
            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    Id = 1,
                    Name = "Admin",
                    Description = "Full system administrator with all permissions",
                    // Task Permissions
                    CanViewAllTasks = true,
                    CanEditAllTasks = true,
                    CanCreateTasks = true,
                    CanDeleteTasks = true,
                    CanAssignTasks = true,
                    // User Permissions
                    CanViewAllUsers = true,
                    CanCreateUsers = true,
                    CanEditUsers = true,
                    CanDeleteUsers = true,
                    // System Permissions
                    CanManageRoles = true,
                    CanManagePermissions = true,
                    CanViewReports = true,
                    CanExportData = true,
                    CreatedAt = baseDate
                },
                new Role
                {
                    Id = 2,
                    Name = "Director",
                    Description = "Department director with extensive permissions",
                    // Task Permissions
                    CanViewAllTasks = true,
                    CanEditAllTasks = true,
                    CanCreateTasks = true,
                    CanDeleteTasks = true,
                    CanAssignTasks = true,
                    // User Permissions
                    CanViewAllUsers = true,
                    CanCreateUsers = true,
                    CanEditUsers = true,
                    CanDeleteUsers = false,
                    // System Permissions
                    CanManageRoles = false,
                    CanManagePermissions = false,
                    CanViewReports = true,
                    CanExportData = true,
                    CreatedAt = baseDate
                },
                new Role
                {
                    Id = 3,
                    Name = "Division",
                    Description = "Division manager with task and user management for their division",
                    // Task Permissions
                    CanViewAllTasks = true,
                    CanEditAllTasks = true,
                    CanCreateTasks = true,
                    CanDeleteTasks = true,
                    CanAssignTasks = true,
                    // User Permissions
                    CanViewAllUsers = true,
                    CanCreateUsers = true,
                    CanEditUsers = true,
                    CanDeleteUsers = false,
                    // System Permissions
                    CanManageRoles = false,
                    CanManagePermissions = false,
                    CanViewReports = true,
                    CanExportData = false,
                    CreatedAt = baseDate
                },
                new Role
                {
                    Id = 4,
                    Name = "User",
                    Description = "Regular user with basic task management",
                    // Task Permissions
                    CanViewAllTasks = false,
                    CanEditAllTasks = false,
                    CanCreateTasks = true,
                    CanDeleteTasks = false,
                    CanAssignTasks = false,
                    // User Permissions
                    CanViewAllUsers = false,
                    CanCreateUsers = false,
                    CanEditUsers = false,
                    CanDeleteUsers = false,
                    // System Permissions
                    CanManageRoles = false,
                    CanManagePermissions = false,
                    CanViewReports = false,
                    CanExportData = false,
                    CreatedAt = baseDate
                }
            );

            // Seed admin user (password: admin123 - should be hashed in production)
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    FullName = "Administrator",
                    Username = "admin",
                    Email = "admin@taskmanager.com",
                    PasswordHash = "admin123", // TODO: Hash this password
                    RoleId = 1, // Admin role
                    CreatedAt = baseDate,
                    IsActive = true
                },
                // Add a Director user
                new User
                {
                    Id = 2,
                    FullName = "John Director",
                    Username = "director",
                    Email = "director@taskmanager.com",
                    PasswordHash = "director123", // TODO: Hash this password
                    RoleId = 2, // Director role
                    CreatedAt = baseDate,
                    IsActive = true
                },
                // Add a Division user
                new User
                {
                    Id = 3,
                    FullName = "Sarah Division",
                    Username = "division",
                    Email = "division@taskmanager.com",
                    PasswordHash = "division123", // TODO: Hash this password
                    RoleId = 3, // Division role
                    CreatedAt = baseDate,
                    IsActive = true
                },
                // Add a regular User
                new User
                {
                    Id = 4,
                    FullName = "Regular User",
                    Username = "user",
                    Email = "user@taskmanager.com",
                    PasswordHash = "user123", // TODO: Hash this password
                    RoleId = 4, // User role
                    CreatedAt = baseDate,
                    IsActive = true
                }
            );

            // Seed some sample tasks
            modelBuilder.Entity<TaskItem>().HasData(
                new TaskItem
                {
                    Id = 1,
                    Title = "Setup Project Structure",
                    Description = "Initialize the project with proper folder structure",
                    Status = "Completed",
                    Priority = "High",
                    AssignedToId = 1,
                    CreatedById = 1,
                    DueDate = baseDate.AddDays(30),
                    CreatedAt = baseDate,
                    CompletedAt = baseDate.AddDays(5)
                },
                new TaskItem
                {
                    Id = 2,
                    Title = "Implement Authentication",
                    Description = "Add JWT authentication to the API",
                    Status = "In Progress",
                    Priority = "High",
                    AssignedToId = 2,
                    CreatedById = 1,
                    DueDate = baseDate.AddDays(45),
                    CreatedAt = baseDate
                },
                new TaskItem
                {
                    Id = 3,
                    Title = "Create Task Dashboard",
                    Description = "Build the main dashboard for task management",
                    Status = "Pending",
                    Priority = "Medium",
                    AssignedToId = 3,
                    CreatedById = 1,
                    DueDate = baseDate.AddDays(60),
                    CreatedAt = baseDate
                },
                new TaskItem
                {
                    Id = 4,
                    Title = "Database Migration",
                    Description = "Create and run database migrations",
                    Status = "Completed",
                    Priority = "High",
                    AssignedToId = 4,
                    CreatedById = 2,
                    DueDate = baseDate.AddDays(15),
                    CreatedAt = baseDate,
                    CompletedAt = baseDate.AddDays(10)
                }
            );
        }
    }
}