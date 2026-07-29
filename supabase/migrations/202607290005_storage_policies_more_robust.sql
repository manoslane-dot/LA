do $$
begin
  if to_regnamespace('storage') is not null then
    if to_regclass('storage.objects') is not null then
      -- Allow authenticated users to read files in the avatars bucket.
      drop policy if exists "authenticated users can view avatars" on storage.objects;
      create policy "authenticated users can view avatars"
        on storage.objects
        for select
        to authenticated
        using (bucket_id = 'avatars');

      -- Allow authenticated users to upload avatars under their own user folder.
      drop policy if exists "authenticated users can upload their own avatars" on storage.objects;
      create policy "authenticated users can upload their own avatars"
        on storage.objects
        for insert
        to authenticated
        with check (
          bucket_id = 'avatars'
          and (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Allow authenticated users to update their own avatars.
      drop policy if exists "authenticated users can update their own avatars" on storage.objects;
      create policy "authenticated users can update their own avatars"
        on storage.objects
        for update
        to authenticated
        using (
          bucket_id = 'avatars'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
        with check (
          bucket_id = 'avatars'
          and (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Allow authenticated users to delete their own avatars.
      drop policy if exists "authenticated users can delete their own avatars" on storage.objects;
      create policy "authenticated users can delete their own avatars"
        on storage.objects
        for delete
        to authenticated
        using (
          bucket_id = 'avatars'
          and (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Allow authenticated users to read files in the product-images bucket.
      drop policy if exists "authenticated users can view product images" on storage.objects;
      create policy "authenticated users can view product images"
        on storage.objects
        for select
        to authenticated
        using (bucket_id = 'product-images');

      -- Allow authenticated users to upload product images under their own user folder.
      drop policy if exists "authenticated users can upload their own product images" on storage.objects;
      create policy "authenticated users can upload their own product images"
        on storage.objects
        for insert
        to authenticated
        with check (
          bucket_id = 'product-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Allow authenticated users to update their own product images.
      drop policy if exists "authenticated users can update their own product images" on storage.objects;
      create policy "authenticated users can update their own product images"
        on storage.objects
        for update
        to authenticated
        using (
          bucket_id = 'product-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
        with check (
          bucket_id = 'product-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        );

      -- Allow authenticated users to delete their own product images.
      drop policy if exists "authenticated users can delete their own product images" on storage.objects;
      create policy "authenticated users can delete their own product images"
        on storage.objects
        for delete
        to authenticated
        using (
          bucket_id = 'product-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        );
    end if;
  end if;
end $$;
