                    @foreach ($workspaces['teams'][0]['members'] as $members)
                    <option value="{{ $members['user']['id'] }}"">{{ $members['user']['username'] }}</option>
                    @endforeach 