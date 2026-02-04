using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TaskManagerApi.Migrations
{
    /// <inheritdoc />
    public partial class FixUserTaskRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Users_AssignedToId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_AssignedToId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "AssignedToId",
                table: "Tasks");

            migrationBuilder.RenameColumn(
                name: "CanManageUsers",
                table: "Roles",
                newName: "CanViewReports");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Roles",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CanAssignTasks",
                table: "Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanCreateTasks",
                table: "Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanCreateUsers",
                table: "Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanDeleteTasks",
                table: "Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanDeleteUsers",
                table: "Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanEditUsers",
                table: "Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanExportData",
                table: "Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanManagePermissions",
                table: "Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanViewAllUsers",
                table: "Roles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Roles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TaskUsers",
                columns: table => new
                {
                    TaskId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    AssignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskUsers", x => new { x.TaskId, x.UserId });
                    table.ForeignKey(
                        name: "FK_TaskUsers_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TaskUsers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CanAssignTasks", "CanCreateTasks", "CanCreateUsers", "CanDeleteTasks", "CanDeleteUsers", "CanEditUsers", "CanExportData", "CanManagePermissions", "CanViewAllUsers", "Description", "UpdatedAt" },
                values: new object[] { true, true, true, true, true, true, true, true, true, "Full system administrator with all permissions", null });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CanAssignTasks", "CanCreateTasks", "CanCreateUsers", "CanDeleteTasks", "CanDeleteUsers", "CanEditUsers", "CanExportData", "CanManagePermissions", "CanViewAllUsers", "CanViewReports", "Description", "Name", "UpdatedAt" },
                values: new object[] { true, true, true, true, false, true, true, false, true, true, "Department director with extensive permissions", "Director", null });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CanAssignTasks", "CanCreateTasks", "CanCreateUsers", "CanDeleteTasks", "CanDeleteUsers", "CanEditAllTasks", "CanEditUsers", "CanExportData", "CanManagePermissions", "CanViewAllTasks", "CanViewAllUsers", "CanViewReports", "Description", "Name", "UpdatedAt" },
                values: new object[] { true, true, true, true, false, true, true, false, false, true, true, true, "Division manager with task and user management for their division", "Division", null });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CanAssignTasks", "CanCreateTasks", "CanCreateUsers", "CanDeleteTasks", "CanDeleteUsers", "CanEditAllTasks", "CanEditUsers", "CanExportData", "CanManagePermissions", "CanManageRoles", "CanViewAllTasks", "CanViewAllUsers", "CanViewReports", "CreatedAt", "Description", "Name", "UpdatedAt" },
                values: new object[] { 4, false, true, false, false, false, false, false, false, false, false, false, false, false, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Regular user with basic task management", "User", null });

            migrationBuilder.InsertData(
                table: "TaskUsers",
                columns: new[] { "TaskId", "UserId", "AssignedAt" },
                values: new object[] { 1, 1, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FullName", "IsActive", "PasswordHash", "RoleId", "UpdatedAt", "Username" },
                values: new object[,]
                {
                    { 2, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "director@taskmanager.com", "John Director", true, "director123", 2, null, "director" },
                    { 3, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "division@taskmanager.com", "Sarah Division", true, "division123", 3, null, "division" }
                });

            migrationBuilder.InsertData(
                table: "TaskUsers",
                columns: new[] { "TaskId", "UserId", "AssignedAt" },
                values: new object[,]
                {
                    { 1, 2, new DateTime(2024, 1, 2, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, 2, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 2, 3, new DateTime(2024, 1, 2, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { 3, 3, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "Tasks",
                columns: new[] { "Id", "ActualHours", "Category", "CompletedAt", "CreatedAt", "CreatedById", "Description", "DueDate", "EstimatedHours", "IsDeleted", "Priority", "Status", "Title", "UpdatedAt" },
                values: new object[] { 4, null, null, new DateTime(2024, 1, 11, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), 2, "Create and run database migrations", new DateTime(2024, 1, 16, 0, 0, 0, 0, DateTimeKind.Utc), null, false, "High", "Completed", "Database Migration", null });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FullName", "IsActive", "PasswordHash", "RoleId", "UpdatedAt", "Username" },
                values: new object[] { 4, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "user@taskmanager.com", "Regular User", true, "user123", 4, null, "user" });

            migrationBuilder.InsertData(
                table: "TaskUsers",
                columns: new[] { "TaskId", "UserId", "AssignedAt" },
                values: new object[] { 4, 4, new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.CreateIndex(
                name: "IX_TaskUsers_UserId",
                table: "TaskUsers",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskUsers");

            migrationBuilder.DeleteData(
                table: "Tasks",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DropColumn(
                name: "CanAssignTasks",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CanCreateTasks",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CanCreateUsers",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CanDeleteTasks",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CanDeleteUsers",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CanEditUsers",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CanExportData",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CanManagePermissions",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "CanViewAllUsers",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Roles");

            migrationBuilder.RenameColumn(
                name: "CanViewReports",
                table: "Roles",
                newName: "CanManageUsers");

            migrationBuilder.AddColumn<int>(
                name: "AssignedToId",
                table: "Tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Roles",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1,
                column: "Description",
                value: "System administrator with full access");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CanManageUsers", "Description", "Name" },
                values: new object[] { false, "Project manager with team management capabilities", "Manager" });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CanEditAllTasks", "CanManageUsers", "CanViewAllTasks", "Description", "Name" },
                values: new object[] { false, false, false, "Regular user with limited access", "User" });

            migrationBuilder.UpdateData(
                table: "Tasks",
                keyColumn: "Id",
                keyValue: 1,
                column: "AssignedToId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Tasks",
                keyColumn: "Id",
                keyValue: 2,
                column: "AssignedToId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Tasks",
                keyColumn: "Id",
                keyValue: 3,
                column: "AssignedToId",
                value: 1);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_AssignedToId",
                table: "Tasks",
                column: "AssignedToId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Users_AssignedToId",
                table: "Tasks",
                column: "AssignedToId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
