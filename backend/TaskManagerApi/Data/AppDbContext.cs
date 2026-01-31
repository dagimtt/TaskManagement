// Data/AppDbContext.cs
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
            
            // Seed roles
            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    Id = 1,
                    Name = "Admin",
                    Description = "System administrator with full access",
                    CanViewAllTasks = true,
                    CanEditAllTasks = true,
                    CanManageUsers = true,
                    CanManageRoles = true,
                    CreatedAt = baseDate  // Static date
                },
                new Role
                {
                    Id = 2,
                    Name = "Manager",
                    Description = "Project manager with team management capabilities",
                    CanViewAllTasks = true,
                    CanEditAllTasks = true,
                    CanManageUsers = false,
                    CanManageRoles = false,
                    CreatedAt = baseDate  // Static date
                },
                new Role
                {
                    Id = 3,
                    Name = "User",
                    Description = "Regular user with limited access",
                    CanViewAllTasks = false,
                    CanEditAllTasks = false,
                    CanManageUsers = false,
                    CanManageRoles = false,
                    CreatedAt = baseDate  // Static date
                }
            );

            // Seed admin user (password: admin123)
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    FullName = "Administrator",
                    Username = "admin",
                    Email = "admin@taskmanager.com",
                    PasswordHash = "admin123", // Will be hashed in production
                    RoleId = 1,
                    CreatedAt = baseDate,  // Static date
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
                    DueDate = baseDate.AddDays(30),  // Static calculation
                    CreatedAt = baseDate,  // Static date
                    CompletedAt = baseDate.AddDays(5)  // Static calculation
                },
                new TaskItem
                {
                    Id = 2,
                    Title = "Implement Authentication",
                    Description = "Add JWT authentication to the API",
                    Status = "In Progress",
                    Priority = "High",
                    AssignedToId = 1,
                    CreatedById = 1,
                    DueDate = baseDate.AddDays(45),  // Static calculation
                    CreatedAt = baseDate  // Static date
                },
                new TaskItem
                {
                    Id = 3,
                    Title = "Create Task Dashboard",
                    Description = "Build the main dashboard for task management",
                    Status = "Pending",
                    Priority = "Medium",
                    AssignedToId = 1,
                    CreatedById = 1,
                    DueDate = baseDate.AddDays(60),  // Static calculation
                    CreatedAt = baseDate  // Static date
                }
            );
        }
    }
}