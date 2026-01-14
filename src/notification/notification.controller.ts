import { Controller, Post, Body, Get, Param, UseGuards, Patch, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('Notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  
  @Post()
  @ApiOperation({ summary: 'Send notification', description: 'Sends a notification to users with specified roles.' })
  @ApiBearerAuth('access-token')
  @ApiCreatedResponse({ description: 'Notification sent', type: CreateNotificationDto })
  @UseGuards(JwtAuthGuard)
  send(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.send(createNotificationDto);
  }


   @Get()
  @ApiOperation({ summary: 'Get all notifications', description: 'Retrieves all notifications.' })
  @ApiOkResponse({ description: 'Notifications retrieved successfully' })
  @UseGuards(JwtAuthGuard)
  getAllNotifications() {
    return this.notificationService.getAllNotifications();
  }

  
@Get(':userId/by-roles/:model')
@ApiOperation({
  summary: 'Get notifications for user by roles & model',
  description: 'Retrieves notifications filtered by userId, roles, and related model.',
})
@ApiParam({ name: 'userId', description: 'User ID', type: String })
@ApiParam({ name: 'model', description: 'Related model (e.g., Property)', type: String })
@ApiQuery({ name: 'roles', description: 'Comma separated roles', required: false })
@ApiOkResponse({ description: 'Notifications retrieved successfully' })
@UseGuards(JwtAuthGuard)
async getForUserRolesAndModel(
  @Param('userId') userId: string,
  @Param('model') model: string,
  @Query('roles') roles: string,
) {
  const userRoles = roles ? roles.split(',').map(r => parseInt(r)) : [];
  return this.notificationService.getForUserRolesAndModel(userId, userRoles, model);
}




  @Get(':userId')
  @ApiOperation({ summary: 'Get notifications for user', description: 'Retrieves notifications for a specific user.' })
  @ApiParam({ name: 'userId', description: 'User ID', type: String })
  @ApiOkResponse({ description: 'Notifications retrieved' })
  @UseGuards(JwtAuthGuard)
  getForUser(@Param('userId') userId: string) {
    return this.notificationService.getForUser(userId);
  }



  @Patch(':id')
  @ApiOperation({ summary: 'Update notification allowed roles', description: 'Updates the allowed roles for a notification.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiOkResponse({ description: 'Notification updated', type: UpdateNotificationDto })
  @UseGuards(JwtAuthGuard)
  updateAllowedRoles(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationService.updateAllowedRoles(id, updateNotificationDto);
  }
}