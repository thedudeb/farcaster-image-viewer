import * as frame from '@farcaster/frame-sdk'

export async function initializeFrame() {
  const context = await frame.sdk.context

  if (!context || !context.user) {
    console.log('not in frame context')
    return
  }

  const user = context.user
  const client = context.client

  window.userFid = user.fid;

  // Track user in our analytics system
  try {
    const response = await fetch('/api/track-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fid: user.fid,
        username: user.username,
        // Check if user already has notifications enabled in the client
        notificationDetails: client.notificationDetails,
        added: client.added,
      }),
    });
    
    if (response.ok) {
      console.log('User tracked successfully:', user.fid, user.username, 
        client.notificationDetails ? 'with notifications' : 'no notifications');
    } else {
      console.error('Failed to track user:', response.status);
    }
  } catch (error) {
    console.error('Error tracking user:', error);
  }

  // You can now use the window.userFid in any of your React code, e.g. using a useEffect that listens for it to be set
  // or trigger a custom event or anything you want

  // Call the ready function to remove your splash screen when in a frame
  await frame.sdk.actions.ready();
}