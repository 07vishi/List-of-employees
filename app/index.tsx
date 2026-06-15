import { Redirect } from 'expo-router';

export default function IndexRoute(): React.ReactElement {
  return <Redirect href="/login" />;
}
