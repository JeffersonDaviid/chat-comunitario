using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatComunitario.Migrations
{
    /// <inheritdoc />
    public partial class AddChannelInvitationsAndIsGeneral : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsGeneral",
                table: "Channels",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ChannelInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChannelId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitedUserCedula = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    InvitedByCedula = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChannelInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChannelInvitations_Channels_ChannelId",
                        column: x => x.ChannelId,
                        principalTable: "Channels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChannelInvitations_Users_InvitedByCedula",
                        column: x => x.InvitedByCedula,
                        principalTable: "Users",
                        principalColumn: "Cedula",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChannelInvitations_Users_InvitedUserCedula",
                        column: x => x.InvitedUserCedula,
                        principalTable: "Users",
                        principalColumn: "Cedula",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChannelInvitations_ChannelId_InvitedUserCedula_Status",
                table: "ChannelInvitations",
                columns: new[] { "ChannelId", "InvitedUserCedula", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ChannelInvitations_InvitedByCedula",
                table: "ChannelInvitations",
                column: "InvitedByCedula");

            migrationBuilder.CreateIndex(
                name: "IX_ChannelInvitations_InvitedUserCedula",
                table: "ChannelInvitations",
                column: "InvitedUserCedula");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChannelInvitations");

            migrationBuilder.DropColumn(
                name: "IsGeneral",
                table: "Channels");
        }
    }
}
