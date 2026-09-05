import React from 'react';
import { Redirect } from 'expo-router';
import { Loading } from '@/components/MoonUI';
import { useMoon } from '@/context/MoonContext';

export default function Index() {
  const { data, hydrated } = useMoon();
  if (!hydrated) return <Loading />;
  return <Redirect href={data.initialized ? '/(tabs)' : '/setup'} />;
}