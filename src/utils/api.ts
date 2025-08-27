
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://mkthooks.adaptahub.org/webhook/ads-manager';
const REQUEST_TIMEOUT = 3000; // 3 seconds

export interface UpdatePayload {
  user: string;
  type: 'campaign' | 'adset' | 'ad';
  object: string;
  field: 'status' | 'budget' | 'objective';
  value: string | number;
}

export interface CreatePayload {
  name: string;
  objective?: string;
  level: 'campaign' | 'adset';
  campaign_id?: string;
  daily_budget?: number;
  account_name?: string;
}

const makeRequest = async (payload: UpdatePayload | CreatePayload): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    console.log('Sending payload to webhook:', payload);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const updateCampaign = async (
  campaignId: string, 
  field: 'status' | 'objective' | 'budget', 
  value: string | number,
  userEmail: string
): Promise<void> => {
  console.log('Updating campaign:', { campaignId, field, value, userEmail });
  
  const payload: UpdatePayload = {
    user: userEmail,
    type: 'campaign',
    object: campaignId,
    field,
    value
  };

  console.log('Campaign payload before sending:', payload);

  const response = await makeRequest(payload);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  console.log('Campaign updated successfully');
};

export const updateAdset = async (
  adsetId: string, 
  field: 'status' | 'budget', 
  value: string | number,
  userEmail: string
): Promise<void> => {
  console.log('Updating adset:', { adsetId, field, value, userEmail });
  
  const payload: UpdatePayload = {
    user: userEmail,
    type: 'adset',
    object: adsetId,
    field,
    value
  };

  console.log('Adset payload before sending:', payload);

  const response = await makeRequest(payload);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  console.log('Adset updated successfully');
};

export const updateAd = async (
  adId: string, 
  field: 'status', 
  value: string,
  userEmail: string
): Promise<void> => {
  console.log('Updating ad:', { adId, field, value, userEmail });
  
  const payload: UpdatePayload = {
    user: userEmail,
    type: 'ad',
    object: adId,
    field,
    value
  };

  console.log('Ad payload before sending:', payload);

  const response = await makeRequest(payload);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  console.log('Ad updated successfully');
};

export const createCampaign = async (data: CreatePayload): Promise<void> => {
  console.log('Creating campaign:', data);
  
  const response = await makeRequest(data);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  console.log('Campaign created successfully');
};

export const createAdset = async (data: CreatePayload): Promise<void> => {
  console.log('Creating adset:', data);
  
  const response = await makeRequest(data);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  console.log('Adset created successfully');
};
